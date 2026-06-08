import { prisma } from '../../../db/prisma';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays } from 'date-fns';

export const transactionRepository = {
  async findById(id: string) {
    return prisma.transaction.findUnique({
      where: { id, deletedAt: null },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } }
    });
  },

  async findByUser(
    userId: string,
    filters: {
      type?: string;
      categoryId?: string;
      from?: string;
      to?: string;
      query?: string;
      page: number;
      pageSize: number;
      sortBy?: string;
      sortOrder?: string;
    }
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
        : {}),
      ...(filters.query
        ? {
            OR: [
              { title: { contains: filters.query, mode: 'insensitive' } },
              { merchant: { contains: filters.query, mode: 'insensitive' } },
              { note: { contains: filters.query, mode: 'insensitive' } }
            ]
          }
        : {})
    };

    const orderBy: any =
      filters.sortBy === 'amount'
        ? { amount: filters.sortOrder ?? 'desc' }
        : { occurredAt: filters.sortOrder ?? 'desc' };

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: { select: { id: true, name: true, icon: true, color: true } } },
        orderBy,
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize
      }),
      prisma.transaction.count({ where })
    ]);

    return { items, total };
  },

  async create(data: any) {
    return prisma.transaction.create({
      data,
      include: { category: { select: { id: true, name: true, icon: true, color: true } } }
    });
  },

  async update(id: string, data: any) {
    return prisma.transaction.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true, icon: true, color: true } } }
    });
  },

  async softDelete(id: string) {
    return prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  async findByClientTxnId(userId: string, clientTxnId: string) {
    return prisma.transaction.findFirst({ where: { userId, clientTxnId, deletedAt: null } });
  },

  // ===== 智能分类所需方法 =====

  /**
   * 聚合用户最近N天最高频分类
   */
  async aggregateUserCategoryFrequency(userId: string, days: number, limit: number) {
    const since = subDays(new Date(), days);
    const results = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, deletedAt: null, type: 'EXPENSE', occurredAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });
    if (results.length === 0) return [];
    const categoryIds = results.map((r: any) => r.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, icon: true, color: true },
    });
    const categoryMap = new Map(categories.map((c: any) => [c.id, c]));
    return results.map((r: any) => ({
      categoryId: r.categoryId,
      category: categoryMap.get(r.categoryId) ?? null,
      count: r._count.id,
    }));
  },

  /**
   * 聚合用户最近N天最高频商户
   */
  async aggregateUserMerchantFrequency(userId: string, days: number, limit: number) {
    const since = subDays(new Date(), days);
    const results: any[] = await prisma.$queryRaw`
      SELECT merchant, category_id as "categoryId", COUNT(*)::int as count
      FROM transactions
      WHERE user_id = ${userId}
        AND deleted_at IS NULL
        AND type = 'EXPENSE'
        AND occurred_at >= ${since}
        AND merchant IS NOT NULL
        AND merchant != ''
      GROUP BY merchant, category_id
      ORDER BY count DESC
      LIMIT ${limit}
    `;
    if (results.length === 0) return [];
    const categoryIds = [...new Set(results.map((r: any) => r.categoryId))];
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, icon: true, color: true },
    });
    const categoryMap = new Map(categories.map((c: any) => [c.id, c]));
    return results.map((r: any) => ({
      merchant: r.merchant,
      categoryId: r.categoryId,
      category: categoryMap.get(r.categoryId) ?? null,
      count: r.count,
    }));
  },

  /**
   * 根据关键词在历史账单中查找最佳商户和分类
   */
  async findBestMerchantCategoryByKeyword(userId: string, keyword: string, days: number) {
    const since = subDays(new Date(), days);
    const results: any[] = await prisma.$queryRaw`
      SELECT merchant, category_id as "categoryId", COUNT(*)::int as count
      FROM transactions
      WHERE user_id = ${userId}
        AND deleted_at IS NULL
        AND occurred_at >= ${since}
        AND (title ILIKE ${'%' + keyword + '%'} OR merchant ILIKE ${'%' + keyword + '%'})
        AND merchant IS NOT NULL
        AND merchant != ''
      GROUP BY merchant, category_id
      ORDER BY count DESC
      LIMIT 1
    `;
    if (results.length === 0) return null;
    const cat = await prisma.category.findUnique({
      where: { id: results[0].categoryId },
      select: { id: true, name: true },
    });
    return {
      merchant: results[0].merchant,
      categoryId: results[0].categoryId,
      categoryName: cat?.name ?? '其它',
      confidence: 0.9,
      source: 'HISTORY',
    };
  },

  /**
   * 根据支付来源返回用户最常用的默认分类
   */
  async findDefaultCategoryBySource(userId: string, source?: string) {
    const where: any = { userId, deletedAt: null, type: 'EXPENSE' };
    if (source === 'wechat') where.title = { contains: '微信', mode: 'insensitive' };
    if (source === 'alipay') where.title = { contains: '支付宝', mode: 'insensitive' };
    const result = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    });
    if (result.length === 0) return null;
    const cat = await prisma.category.findUnique({
      where: { id: result[0].categoryId },
      select: { id: true, name: true },
    });
    return { categoryId: result[0].categoryId, categoryName: cat?.name ?? '其它' };
  },

  /**
   * 自适应学习：更新商户-分类权重
   */
  async upsertMerchantCategoryWeight(userId: string, merchant: string, categoryId: string) {
    const existing = await prisma.merchantRule.findFirst({
      where: { userId, merchant },
    });
    if (existing) {
      await prisma.merchantRule.update({
        where: { id: existing.id },
        data: { categoryId, weight: { increment: 1 }, updatedAt: new Date() },
      });
    } else {
      await prisma.merchantRule.create({
        data: { userId, merchant, categoryId, weight: 1 },
      });
    }
  },

  /**
   * 通过商户规则查找分类
   */
  async findCategoryByMerchantRule(userId: string, merchant: string) {
    const rule = await prisma.merchantRule.findFirst({
      where: { userId, merchant: { contains: merchant, mode: 'insensitive' } },
      orderBy: { weight: 'desc' },
    });
    if (!rule) return null;
    const cat = await prisma.category.findUnique({
      where: { id: rule.categoryId },
      select: { id: true, name: true },
    });
    return {
      merchant,
      categoryId: rule.categoryId,
      categoryName: cat?.name ?? '其它',
      confidence: 0.85,
      source: 'RULE_WEIGHT',
    };
  },
};
