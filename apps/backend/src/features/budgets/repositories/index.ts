import { prisma } from '../../../db/prisma';

export const budgetRepository = {
  async findById(id: string) {
    return prisma.budget.findUnique({ where: { id, deletedAt: null } });
  },

  async findByUser(userId: string, filters: { year: number; month?: number; periodType?: string }) {
    const where: any = {
      userId,
      deletedAt: null,
      year: filters.year,
      ...(filters.month ? { month: filters.month } : {}),
      ...(filters.periodType ? { periodType: filters.periodType } : {})
    };
    return prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });
  },

  async findByUniqueKey(userId: string, periodType: string, year: number, month: number, categoryId: string | null) {
    return prisma.budget.findFirst({
      where: {
        userId,
        periodType: periodType as any,
        year,
        month,
        categoryId,
        deletedAt: null
      }
    });
  },

  async create(data: any) {
    return prisma.budget.create({ data });
  },

  async update(id: string, data: any) {
    return prisma.budget.update({ where: { id }, data });
  },

  async softDelete(id: string) {
    return prisma.budget.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  async getSpentAmount(userId: string, categoryId: string | null, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const result = await prisma.transaction.aggregate({
      where: {
        userId,
        deletedAt: null,
        type: 'EXPENSE',
        occurredAt: { gte: startDate, lte: endDate },
        ...(categoryId ? { categoryId } : {})
      },
      _sum: { amount: true }
    });

    return result._sum.amount ?? 0;
  }
};

