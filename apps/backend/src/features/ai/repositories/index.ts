import { prisma } from '../../../db/prisma';

export const aiRepository = {
  async getUserFinancialSummary(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const [expenseByCategory, incomeTotal, expenseTotal, recentTxns, budgets] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { userId, deletedAt: null, type: 'EXPENSE', occurredAt: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } }
      }),
      prisma.transaction.aggregate({
        where: { userId, deletedAt: null, type: 'INCOME', occurredAt: { gte: startDate, lte: endDate } },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { userId, deletedAt: null, type: 'EXPENSE', occurredAt: { gte: startDate, lte: endDate } },
        _sum: { amount: true }
      }),
      prisma.transaction.findMany({
        where: { userId, deletedAt: null, occurredAt: { gte: startDate, lte: endDate } },
        orderBy: { amount: 'desc' },
        take: 20,
        include: { category: { select: { name: true } } }
      }),
      prisma.budget.findMany({
        where: { userId, deletedAt: null, year, month, periodType: 'MONTHLY' }
      })
    ]);

    const categoryIds = expenseByCategory.map(e => e.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true }
    });
    const catMap = new Map(categories.map(c => [c.id, c.name]));

    const categoryBreakdown = expenseByCategory.map(e => ({
      category: catMap.get(e.categoryId) || '未知',
      amount: e._sum.amount || 0,
      count: e._count
    }));

    // Get previous month for comparison
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth <= 0) { prevMonth = 12; prevYear -= 1; }
    const prevStart = new Date(prevYear, prevMonth - 1, 1);
    const prevEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);
    const prevExpense = await prisma.transaction.aggregate({
      where: { userId, deletedAt: null, type: 'EXPENSE', occurredAt: { gte: prevStart, lte: prevEnd } },
      _sum: { amount: true }
    });

    return {
      year, month,
      totalIncome: incomeTotal._sum.amount || 0,
      totalExpense: expenseTotal._sum.amount || 0,
      prevMonthExpense: prevExpense._sum.amount || 0,
      categoryBreakdown,
      topExpenses: recentTxns.map(t => ({
        title: t.title,
        amount: t.amount,
        category: t.category.name,
        date: t.occurredAt.toISOString().slice(0, 10)
      })),
      budgets: budgets.map(b => ({ amount: b.amount, categoryId: b.categoryId }))
    };
  },

  async getMultiMonthSummary(userId: string, endYear: number, endMonth: number, count: number) {
    const months: { year: number; month: number; expense: number; income: number }[] = [];
    for (let i = count - 1; i >= 0; i--) {
      let m = endMonth - i;
      let y = endYear;
      while (m <= 0) { m += 12; y -= 1; }
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      const [exp, inc] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, deletedAt: null, type: 'EXPENSE', occurredAt: { gte: start, lte: end } },
          _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
          where: { userId, deletedAt: null, type: 'INCOME', occurredAt: { gte: start, lte: end } },
          _sum: { amount: true }
        })
      ]);
      months.push({ year: y, month: m, expense: exp._sum.amount || 0, income: inc._sum.amount || 0 });
    }
    return months;
  }
};
