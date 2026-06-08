import { prisma } from '../../../db/prisma';

export const attachmentRepository = {
  async findById(id: string) {
    return prisma.attachment.findUnique({ where: { id, deletedAt: null } });
  },

  async findByTransaction(transactionId: string) {
    return prisma.attachment.findMany({ where: { transactionId, deletedAt: null } });
  },

  async create(data: any) {
    return prisma.attachment.create({ data });
  },

  async softDelete(id: string) {
    return prisma.attachment.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  async countByTransaction(transactionId: string) {
    return prisma.attachment.count({ where: { transactionId, deletedAt: null } });
  }
};
