import { prisma } from '../../../db/prisma';
import { EXPORT_MAX_ROWS } from '@moneytrack/shared';

export const exportRepository = {
  async getTransactionsForExport(
    userId: string,
    filters: { type?: string; categoryId?: string; from?: string; to?: string }
  ) {
    const where: any = {
      userId,
      deletedAt: null,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.from || filters.to
        ? {
            occurredAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {})
            }
          }
        : {})
    };

    const count = await prisma.transaction.count({ where });
    if (count > EXPORT_MAX_ROWS) {
      return { count, items: [] };
    }

    const items = await prisma.transaction.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: { occurredAt: 'desc' }
    });

    return { count, items };
  }
};
