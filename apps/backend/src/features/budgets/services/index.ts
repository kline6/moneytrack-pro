import { budgetRepository } from '../repositories';
import { AppError } from '../../../errors';

export const budgetService = {
  async list(userId: string, filters: { year: number; month?: number; periodType?: string }) { return budgetRepository.findByUser(userId, filters); },
  async create(userId: string, input: any) {
    const existing = await budgetRepository.findByUniqueKey(userId, input.periodType, input.year, input.month, input.categoryId ?? null);
    if (existing) throw AppError.conflict('BUDGET_ALREADY_EXISTS', 'Budget already exists');
    const data: any = {
      user: { connect: { id: userId } },
      periodType: input.periodType,
      year: input.year,
      month: input.month,
      weekStart: input.weekStart ? new Date(input.weekStart) : null,
      amount: input.amount,
      currencyCode: 'CNY',
    };
    if (input.categoryId) {
      data.category = { connect: { id: input.categoryId } };
    }
    return budgetRepository.create(data);
  },
  async update(userId: string, id: string, input: { amount: number }) { const b = await budgetRepository.findById(id); if (!b || b.userId !== userId) throw AppError.notFound('Budget not found'); return budgetRepository.update(id, { amount: input.amount }); },
  async delete(userId: string, id: string) { const b = await budgetRepository.findById(id); if (!b || b.userId !== userId) throw AppError.notFound('Budget not found'); return budgetRepository.softDelete(id); },
  async getBudgetSummary(userId: string, year: number, month: number) {
    const budgets = await budgetRepository.findByUser(userId, { year, month, periodType: 'MONTHLY' });
    const overallBudget = budgets.find((b: any) => !b.categoryId);
    const categoryBudgets = budgets.filter((b: any) => !!b.categoryId);
    const summaries = await Promise.all(categoryBudgets.map(async (budget: any) => {
      const spent = await budgetRepository.getSpentAmount(userId, budget.categoryId, year, month);
      return {
        id: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.category?.name || '分类',
        amount: budget.amount,
        spent,
        remaining: budget.amount - spent,
        percentage: budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0,
        isExceeded: spent > budget.amount,
      };
    }));
    let overallSpent = 0;
    if (overallBudget) {
      overallSpent = await budgetRepository.getSpentAmount(userId, null, year, month);
    }
    const categoryTotalBudget = summaries.reduce((s: number, b: any) => s + b.amount, 0);
    const categoryTotalSpent = summaries.reduce((s: number, b: any) => s + b.spent, 0);
    return {
      year,
      month,
      overall: overallBudget ? {
        id: overallBudget.id,
        amount: overallBudget.amount,
        spent: overallSpent,
        remaining: overallBudget.amount - overallSpent,
        percentage: overallBudget.amount > 0 ? Math.round((overallSpent / overallBudget.amount) * 100) : 0,
        isExceeded: overallSpent > overallBudget.amount,
      } : null,
      categoryBudgets: summaries,
      categoryTotalBudget,
      categoryTotalSpent,
      categoryTotalRemaining: categoryTotalBudget - categoryTotalSpent,
    };
  },
  async getAnnualSummary(userId: string, year: number) {
    const months: any[] = [];
    for (let m = 1; m <= 12; m++) {
      const budgets = await budgetRepository.findByUser(userId, { year, month: m, periodType: 'MONTHLY' });
      const overallBudget = budgets.find((b: any) => !b.categoryId);
      const catBudgets = budgets.filter((b: any) => !!b.categoryId);
      let displayBudget = 0;
      let displaySpent = 0;
      if (overallBudget) {
        displayBudget = overallBudget.amount;
        displaySpent = await budgetRepository.getSpentAmount(userId, null, year, m);
      } else {
        displayBudget = catBudgets.reduce((s: number, b: any) => s + b.amount, 0);
        for (const cb of catBudgets) {
          displaySpent += await budgetRepository.getSpentAmount(userId, cb.categoryId, year, m);
        }
      }
      months.push({ month: m, totalBudget: displayBudget, totalSpent: displaySpent, totalRemaining: displayBudget - displaySpent, percentage: displayBudget > 0 ? Math.round((displaySpent / displayBudget) * 100) : 0, isExceeded: displaySpent > displayBudget });
    }
    const annualBudget = months.reduce((s, m) => s + m.totalBudget, 0);
    const annualSpent = months.reduce((s, m) => s + m.totalSpent, 0);
    return { year, annualBudget, annualSpent, annualRemaining: annualBudget - annualSpent, annualPercentage: annualBudget > 0 ? Math.round((annualSpent / annualBudget) * 100) : 0, months };
  }
};
