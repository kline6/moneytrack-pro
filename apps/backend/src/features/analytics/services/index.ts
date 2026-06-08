import { analyticsRepository } from '../repositories';
import { budgetService } from '../../budgets/services';


/** 获取北京时间的日期范围 */
function getBJRange(viewType: 'day' | 'week' | 'month') {
  const now = new Date();
  const bjNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const y = bjNow.getUTCFullYear();
  const m = bjNow.getUTCMonth();
  const d = bjNow.getUTCDate();
  let startDate: Date, endDate: Date;
  if (viewType === 'day') {
    startDate = new Date(Date.UTC(y, m, d) - 8 * 60 * 60 * 1000);
    endDate = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - 8 * 60 * 60 * 1000);
  } else if (viewType === 'week') {
    const bjDay = new Date(Date.UTC(y, m, d));
    const dow = bjDay.getUTCDay() || 7;
    startDate = new Date(Date.UTC(y, m, d - dow + 1) - 8 * 60 * 60 * 1000);
    endDate = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - 8 * 60 * 60 * 1000);
  } else {
    startDate = new Date(Date.UTC(y, m, 1) - 8 * 60 * 60 * 1000);
    endDate = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999) - 8 * 60 * 60 * 1000);
  }
  return { startDate, endDate, year: y, month: m + 1 };
}
export const analyticsService = {
  async getDashboard(userId: string) {
    const now = new Date();
    const bjNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const year = bjNow.getUTCFullYear();
    const month = bjNow.getUTCMonth() + 1;

    const [monthlySummary, todaySummary, budgetSummary] = await Promise.all([
      analyticsRepository.getMonthlySummary(userId, year, month),
      analyticsRepository.getTodaySummary(userId),
      budgetService.getBudgetSummary(userId, year, month)
    ]);

    return {
      monthly: monthlySummary,
      today: todaySummary.today,
      recentTransactions: todaySummary.recentTransactions,
      budget: (() => {
        const hasOverall = budgetSummary.overall && budgetSummary.overall.amount > 0;
        const budget = hasOverall ? budgetSummary.overall.amount : budgetSummary.categoryTotalBudget;
        const spent = hasOverall ? budgetSummary.overall.spent : budgetSummary.categoryTotalSpent;
        const remaining = hasOverall ? budgetSummary.overall.remaining : budgetSummary.categoryTotalRemaining;
        return {
          totalBudget: budget,
          totalSpent: spent,
          totalRemaining: remaining,
          totalPercentage: budget > 0 ? Math.round((spent / budget) * 100) : 0,
        };
      })()
    };
  },

  async getMonthlyReport(userId: string, year: number, month: number) {
    const [summary, categoryBreakdown, dailyTrend] = await Promise.all([
      analyticsRepository.getMonthlySummary(userId, year, month),
      analyticsRepository.getCategoryBreakdown(userId, year, month, 'EXPENSE'),
      analyticsRepository.getDailyTrend(userId, year, month)
    ]);

    const totalExpense = categoryBreakdown.reduce((s: number, c: any) => s + c.totalAmount, 0);
    const withPercentage = categoryBreakdown.map((c: any) => ({
      ...c,
      percentage: totalExpense > 0 ? Math.round((c.totalAmount / totalExpense) * 100) : 0
    }));

    return { summary, categoryBreakdown: withPercentage, dailyTrend };
  },

  async getTrend(userId: string, year: number, months: number) {
    return analyticsRepository.getMonthlyTrend(userId, year, months);
  },

  async getSmartInsights(userId: string, viewType: 'day' | 'week' | 'month') {
    const { startDate, endDate } = getBJRange(viewType);
    const now = new Date();

    const [categoryBreakdown, topExpenses] = await Promise.all([
      analyticsRepository.getCategoryBreakdownByRange(userId, startDate, endDate, 'EXPENSE'),
      analyticsRepository.getTopExpensesByRange(userId, startDate, endDate, 3),
    ]);

    const totalExpense = categoryBreakdown.reduce((s: number, c: any) => s + c.totalAmount, 0);
    const withPercentage = categoryBreakdown.map((c: any) => ({
      ...c,
      percentage: totalExpense > 0 ? Math.round((c.totalAmount / totalExpense) * 100) : 0,
    }));

    // 直给洞察
    const insights: string[] = [];
    if (withPercentage.length > 0) {
      const top = withPercentage[0];
      if (top.percentage > 40) {
        insights.push(`${top.category?.name || '未知'}占本${viewType === 'day' ? '日' : viewType === 'week' ? '周' : '月'}支出的${top.percentage}%，是最大消费项`);
      }
    }
    if (topExpenses.length > 0) {
      const biggest = topExpenses[0];
      insights.push(`最大单笔支出：${biggest.title}（${biggest.category?.name}），${(biggest.amount / 100).toFixed(2)}元`);
    }

    // 预算预警（月视角）
    let budgetAlert = null;
    if (viewType === 'month') {
      const budgetSummary = await budgetService.getBudgetSummary(userId, now.getFullYear(), now.getMonth() + 1);
      const overall = budgetSummary.overall;
      if (overall && overall.amount > 0) {
        const bjNow2 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        const dayOfMonth = bjNow2.getUTCDate();
        const daysInMonth = new Date(Date.UTC(bjNow2.getUTCFullYear(), bjNow2.getUTCMonth() + 1, 0)).getUTCDate();
        const timePercent = Math.round((dayOfMonth / daysInMonth) * 100);
        const budgetPercent = overall.percentage;
        if (timePercent < 50 && budgetPercent > 70) {
          budgetAlert = {
            level: 'warning',
            message: `本月仅过${timePercent}%，预算已消耗${budgetPercent}%，消费速度偏快`,
          };
        } else if (budgetPercent > 100) {
          budgetAlert = {
            level: 'exceeded',
            message: `本月预算已超支${budgetPercent - 100}%`,
          };
        }
      }
    }

    // 周对比（周视角）
    let weekComparison = null;
    if (viewType === 'week') {
      const lastWeekStart = new Date(startDate);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(startDate);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
      lastWeekEnd.setHours(23, 59, 59, 999);
      const [currentWeekExpense, lastWeekExpense] = await Promise.all([
        analyticsRepository.getExpenseSumByRange(userId, startDate, endDate),
        analyticsRepository.getExpenseSumByRange(userId, lastWeekStart, lastWeekEnd),
      ]);
      const diff = currentWeekExpense - lastWeekExpense;
      if (diff > 0) {
        weekComparison = {
          message: `本周比上周多花${(diff / 100).toFixed(0)}元`,
          diff,
        };
      } else if (diff < 0) {
        weekComparison = {
          message: `本周比上周少花${(Math.abs(diff) / 100).toFixed(0)}元`,
          diff,
        };
      }
    }

    // Daily trend for week/day view
    let dailyTrend = null;
    if (viewType === 'week' || viewType === 'day') {
      dailyTrend = await analyticsRepository.getDailyTrendByRange(userId, startDate, endDate);
    }

    return {
      viewType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalExpense,
      categoryBreakdown: withPercentage,
      topExpenses,
      insights,
      budgetAlert,
      weekComparison,
      dailyTrend,
    };
  },
};
