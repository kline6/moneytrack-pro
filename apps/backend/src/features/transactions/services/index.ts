import { transactionRepository } from '../repositories';
import { categoryRepository } from '../../categories/repositories';
import { AppError } from '../../../errors';
import { buildPageMeta, computeSkip } from '../../../utils';

export const transactionService = {
  async list(userId: string, filters: any) {
    const { items, total } = await transactionRepository.findByUser(userId, filters);
    return { items, meta: buildPageMeta(filters.page, filters.pageSize, total) };
  },

  async getById(userId: string, id: string) {
    const txn = await transactionRepository.findById(id);
    if (!txn || txn.userId !== userId) {
      throw AppError.notFound('交易不存在');
    }
    return txn;
  },

  async create(userId: string, input: any) {
    // Validate category belongs to user
    const category = await categoryRepository.findById(input.categoryId);
    if (!category || category.userId !== userId) {
      throw AppError.validation('TRANSACTION_CATEGORY_MISMATCH', [
        { field: 'categoryId', message: '分类不存在或不属于当前用户', rule: 'invalid_reference' }
      ]);
    }
    if (category.transactionType !== input.type) {
      throw AppError.validation('TRANSACTION_CATEGORY_MISMATCH', [
        { field: 'type', message: '交易类型与分类类型不匹配', rule: 'type_mismatch' }
      ]);
    }

    // Check duplicate clientTxnId
    const existing = await transactionRepository.findByClientTxnId(userId, input.clientTxnId);
    if (existing) {
      throw AppError.conflict('TRANSACTION_DUPLICATE_CLIENT_ID', '重复的客户端交易ID');
    }

    return transactionRepository.create({
      user: { connect: { id: userId } },
      category: { connect: { id: input.categoryId } },
      type: input.type,
      amount: input.amount,
      occurredAt: new Date(input.occurredAt),
      title: input.title,
      note: input.note ?? null,
      merchant: input.merchant ?? null,
      tags: input.tags ?? null,
      clientTxnId: input.clientTxnId,
      currencyCode: 'CNY'
    });
  },

  async update(userId: string, id: string, input: any) {
    const txn = await transactionRepository.findById(id);
    if (!txn || txn.userId !== userId) {
      throw AppError.notFound('交易不存在');
    }

    if (input.categoryId) {
      const category = await categoryRepository.findById(input.categoryId);
      if (!category || category.userId !== userId) {
        throw AppError.validation('TRANSACTION_CATEGORY_MISMATCH', [
          { field: 'categoryId', message: '分类不存在或不属于当前用户', rule: 'invalid_reference' }
        ]);
      }
    }

    const updateData: any = {};
    if (input.categoryId) updateData.category = { connect: { id: input.categoryId } };
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.occurredAt) updateData.occurredAt = new Date(input.occurredAt);
    if (input.title) updateData.title = input.title;
    if (input.note !== undefined) updateData.note = input.note;
    if (input.merchant !== undefined) updateData.merchant = input.merchant;
    if (input.tags !== undefined) updateData.tags = input.tags;

    return transactionRepository.update(id, updateData);
  },

  async delete(userId: string, id: string) {
    const txn = await transactionRepository.findById(id);
    if (!txn || txn.userId !== userId) {
      throw AppError.notFound('交易不存在');
    }
    return transactionRepository.softDelete(id);
  },

  async batchUpdateCategory(userId: string, ids: string[], categoryId: string) {
    const category = await categoryRepository.findById(categoryId);
    if (!category || category.userId !== userId) {
      throw AppError.validation('TRANSACTION_CATEGORY_MISMATCH', [
        { field: 'categoryId', message: '分类不存在或不属于当前用户', rule: 'invalid_reference' }
      ]);
    }
    const results: any[] = [];
    for (const id of ids) {
      const txn = await transactionRepository.findById(id);
      if (txn && txn.userId === userId) {
        const updated = await transactionRepository.update(id, { category: { connect: { id: categoryId } } });
        results.push(updated);
      }
    }
    return { updated: results.length, items: results };
  },

  async batchDelete(userId: string, ids: string[]) {
    const results: string[] = [];
    for (const id of ids) {
      const txn = await transactionRepository.findById(id);
      if (txn && txn.userId === userId) {
        await transactionRepository.softDelete(id);
        results.push(id);
      }
    }
    return { deleted: results.length, ids: results };
  },

  async mergeTransactions(userId: string, primaryId: string, secondaryId: string) {
    const primary = await transactionRepository.findById(primaryId);
    const secondary = await transactionRepository.findById(secondaryId);
    if (!primary || primary.userId !== userId) throw AppError.notFound('主交易不存在');
    if (!secondary || secondary.userId !== userId) throw AppError.notFound('副交易不存在');

    // 合并备注
    const mergedNote = [primary.note, secondary.note].filter(Boolean).join(' | ');
    await transactionRepository.update(primaryId, { note: mergedNote || null });
    await transactionRepository.softDelete(secondaryId);

    return { primaryId, secondaryId, mergedNote };
  },
};