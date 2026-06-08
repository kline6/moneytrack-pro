import { prisma } from '../../../db/prisma';

export const syncRepository = {
  async findById(id: string) {
    return prisma.syncEvent.findUnique({ where: { id } });
  },
  async findByUser(userId: string, filters?: { status?: string }) {
    return prisma.syncEvent.findMany({
      where: { userId, ...(filters?.status ? { status: filters.status as any } : {}) },
      orderBy: { createdAt: 'desc' }, take: 100
    });
  },
  async findByClientTxnId(userId: string, clientTxnId: string) {
    return prisma.syncEvent.findFirst({ where: { userId, clientTxnId } });
  },
  async create(data: any) { return prisma.syncEvent.create({ data }); },
  async updateStatus(id: string, status: string, entityId?: string) {
    return prisma.syncEvent.update({
      where: { id },
      data: { status: status as any, entityId: entityId || undefined, processedAt: status !== 'PENDING' ? new Date() : undefined }
    });
  },
  async incrementRetry(id: string) {
    return prisma.syncEvent.update({ where: { id }, data: { retryCount: { increment: 1 } } });
  },
  async getConflicts(userId: string) {
    return prisma.syncEvent.findMany({ where: { userId, status: 'CONFLICT' }, orderBy: { createdAt: 'desc' } });
  }
};
