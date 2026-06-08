import { categoryRepository } from '../repositories';
import { AppError } from '../../../errors';

export const categoryService = {
  async list(userId: string, filters?: { transactionType?: string }) {
    return categoryRepository.findByUser(userId, filters);
  },

  async getById(userId: string, id: string) {
    const category = await categoryRepository.findById(id);
    if (!category || category.userId !== userId) {
      throw AppError.notFound('分类不存在');
    }
    return category;
  },

  async create(userId: string, input: { name: string; icon: string; color: string; transactionType: string; sortOrder?: number }) {
    const category = await categoryRepository.create({
      user: { connect: { id: userId } },
      name: input.name,
      icon: input.icon,
      color: input.color,
      transactionType: input.transactionType as any,
      sortOrder: input.sortOrder ?? 0,
      isSystem: false
    });
    return category;
  },

  async update(userId: string, id: string, input: { name?: string; icon?: string; color?: string; sortOrder?: number }) {
    const category = await categoryRepository.findById(id);
    if (!category || category.userId !== userId) {
      throw AppError.notFound('分类不存在');
    }
    if (category.isSystem) {
      throw AppError.forbidden('系统默认分类不可修改');
    }
    return categoryRepository.update(id, input);
  },

  async delete(userId: string, id: string) {
    const category = await categoryRepository.findById(id);
    if (!category || category.userId !== userId) {
      throw AppError.notFound('分类不存在');
    }
    if (category.isSystem) {
      throw AppError.forbidden('系统默认分类不可删除');
    }
    return categoryRepository.softDelete(id);
  }
};