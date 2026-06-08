import { prisma } from '../../../db/prisma';


/** 获取北京时间的今天日期范围（start/end） */
function getBJDateRange(date?: Date) {
  const now = date || new Date();
  // 北京时间 = UTC + 8h
  const bjNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const y = bjNow.getUTCFullYear();
  const m = bjNow.getUTCMonth();
  const d = bjNow.getUTCDate();
  const start = new Date(Date.UTC(y, m, d) - 8 * 60 * 60 * 1000);
  const end = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - 8 * 60 * 60 * 1000);
  return { year: y, month: m + 1, day: d, start, end };
}

export const analyticsRepository = {
  async getMonthlySummary(userId: string, year: number, month: number) {
    const startDate = new Date(Date.UTC(year, month - 1, 1) - 8 * 60 * 60 * 1000);
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999) - 8 * 60 * 60 * 1000);

    const [expense, income] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, deletedAt: null, type: 'EXPENSE', occurredAt: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
        _count: true
      }),
      prisma.transaction.aggregate({
        where: { userId, deletedAt: null, type: 'INCOME', occurredAt: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
        _count: true
      })
    ]);

    return {
      year,
      month,
      totalExpense: expense._sum.amount ?? 0,
      expenseCount: expense._count,
      totalIncome: income._sum.amount ?? 0,
      incomeCount: income._count,
      netAmount: (income._sum.amount ?? 0) - (expense._sum.amount ?? 0)
    };
  },

  async getCategoryBreakdown(userId: string, year: number, month: number, type: 'EXPENSE' | 'INCOME' = 'EXPENSE') {
    const startDate = new Date(Date.UTC(year, month - 1, 1) - 8 * 60 * 60 * 1000);
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999) - 8 * 60 * 60 * 1000);

    const results = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, deletedAt: null, type, occurredAt: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } }
    });

    const categoryIds = results.map((r: any) => r.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, icon: true, color: true }
    });
    const categoryMap = new Map(categories.map((c: any) => [c.id, c]));

    return results.map((r: any) => ({
      categoryId: r.categoryId,
      category: categoryMap.get(r.categoryId) ?? null,
      totalAmount: r._sum.amount ?? 0,
      count: r._count,
      percentage: 0
    }));
  },

  async getDailyTrend(userId: string, year: number, month: number) {
    const startDate = new Date(Date.UTC(year, month - 1, 1) - 8 * 60 * 60 * 1000);
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999) - 8 * 60 * 60 * 1000);

    const transactions = await prisma.transaction.findMany({
      where: { userId, deletedAt: null, occurredAt: { gte: startDate, lte: endDate } },
      select: { occurredAt: true, type: true, amount: true },
      orderBy: { occurredAt: 'asc' }
    });

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const dailyData: Record<number, { expense: number; income: number }> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyData[d] = { expense: 0, income: 0 };
    }

    for (const txn of transactions) {
      const day = txn.occurredAt.getDate();
      if (txn.type === 'EXPENSE') {
        dailyData[day].expense += txn.amount;
      } else {
        dailyData[day].income += txn.amount;
      }
    }

    return Object.entries(dailyData).map(([day, data]) => ({
      day: Number(day),
      expense: data.expense,
      income: data.income
    }));
  },

  async getMonthlyTrend(userId: string, year: number, count: number) {
    const results: { year: number; month: number; totalExpense: number; totalIncome: number }[] = [];

    for (let i = count - 1; i >= 0; i--) {
      let targetMonth = new Date().getMonth() + 1 - i;
      let targetYear = year;
      while (targetMonth <= 0) {
        targetMonth += 12;
        targetYear -= 1;
      }

      const startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1) - 8 * 60 * 60 * 1000);
      const endDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999) - 8 * 60 * 60 * 1000);

      const [expense, income] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, deletedAt: null, type: 'EXPENSE', occurredAt: { gte: startDate, lte: endDate } },
          _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
          where: { userId, deletedAt: null, type: 'INCOME', occurredAt: { gte: startDate, lte: endDate } },
          _sum: { amount: true }
        })
      ]);

      results.push({
        year: targetYear,
        month: targetMonth,
        totalExpense: expense._sum.amount ?? 0,
        totalIncome: income._sum.amount ?? 0
      });
    }

    return results;
  },

  async getTodaySummary(userId: string) {
    const { start: startOfDay, end: endOfDay } = getBJDateRange();

    const [expense, income, recentTxns] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, deletedAt: null, type: 'EXPENSE', occurredAt: { gte: startOfDay, lte: endOfDay } },
        _sum: { amount: true },
        _count: true
      }),
      prisma.transaction.aggregate({
        where: { userId, deletedAt: null, type: 'INCOME', occurredAt: { gte: startOfDay, lte: endOfDay } },
        _sum: { amount: true },
        _count: true
      }),
      prisma.transaction.findMany({
        where: { userId, deletedAt: null },
        orderBy: { occurredAt: 'desc' },
        take: 5,
        include: { category: { select: { id: true, name: true, icon: true, color: true } } }
      })
    ]);

    return {
      today: {
        expense: expense._sum.amount ?? 0,
        expenseCount: expense._count,
        income: income._sum.amount ?? 0,
        incomeCount: income._count
      },
      recentTransactions: recentTxns
    };
  },

  async getCategoryBreakdownByRange(userId: string, startDate: Date, endDate: Date, type: 'EXPENSE' | 'INCOME' = 'EXPENSE') {
    const results = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, deletedAt: null, type, occurredAt: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } }
    });

    const categoryIds = results.map((r: any) => r.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, icon: true, color: true }
    });
    const categoryMap = new Map(categories.map((c: any) => [c.id, c]));

    return results.map((r: any) => ({
      categoryId: r.categoryId,
      category: categoryMap.get(r.categoryId) ?? null,
      totalAmount: r._sum.amount ?? 0,
      count: r._count,
    }));
  },

  async getTopExpensesByRange(userId: string, startDate: Date, endDate: Date, limit: number) {
    const items = await prisma.transaction.findMany({
      where: { userId, deletedAt: null, type: 'EXPENSE', occurredAt: { gte: startDate, lte: endDate } },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
      orderBy: { amount: 'desc' },
      take: limit,
    });
    return items;
  },

  async getExpenseSumByRange(userId: string, startDate: Date, endDate: Date) {
    const result = await prisma.transaction.aggregate({
      where: { userId, deletedAt: null, type: 'EXPENSE', occurredAt: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  },

  async getDailyTrendByRange(userId: string, startDate: Date, endDate: Date) {
    const transactions = await prisma.transaction.findMany({
      where: { userId, deletedAt: null, type: 'EXPENSE', occurredAt: { gte: startDate, lte: endDate } },
      select: { occurredAt: true, amount: true },
      orderBy: { occurredAt: 'asc' },
    });

    const dailyMap: Record<string, number> = {};
    const current = new Date(startDate);
    while (current <= endDate) {
      const key = current.toISOString().slice(0, 10);
      dailyMap[key] = 0;
      current.setDate(current.getDate() + 1);
    }

    for (const txn of transactions) {
      const key = txn.occurredAt.toISOString().slice(0, 10);
      dailyMap[key] = (dailyMap[key] || 0) + txn.amount;
    }

    return Object.entries(dailyMap).map(([date, amount]) => ({ date, amount }));
  },
};
