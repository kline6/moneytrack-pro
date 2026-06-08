import { prisma } from '../../../db/prisma';

export const categoryRepository = {
  async findById(id: string) {
    return prisma.category.findUnique({ where: { id, deletedAt: null } });
  },

  async findByUser(userId: string, filters?: { transactionType?: string }) {
    return prisma.category.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(filters?.transactionType ? { transactionType: filters.transactionType as any } : {})
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });
  },

  async create(data: any) {
    return prisma.category.create({ data });
  },

  async update(id: string, data: any) {
    return prisma.category.update({ where: { id }, data });
  },

  async softDelete(id: string) {
    return prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  async countByUser(userId: string) {
    return prisma.category.count({ where: { userId, deletedAt: null } });
  },

  /**
   * 模糊搜索用户分类，用于智能分类匹配
   */
  async findClosestByUser(userId: string, keyword: string) {
    const categories = await prisma.category.findMany({
      where: {
        userId,
        deletedAt: null,
        name: { contains: keyword, mode: 'insensitive' },
      },
      orderBy: { sortOrder: 'asc' },
      take: 1,
    });
    if (categories.length > 0) return categories[0];
    // 兜底返回"其它"
    const fallback = await prisma.category.findFirst({
      where: { userId, deletedAt: null, name: '其它' },
    });
    return fallback ?? null;
  },
};
