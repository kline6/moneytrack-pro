import { syncRepository } from '../repositories';
import { transactionRepository } from '../../transactions/repositories';
import { categoryRepository } from '../../categories/repositories';
import { budgetRepository } from '../../budgets/repositories';
import { AppError } from '../../../errors';
import { logger } from '../../../infrastructure/logger';

export const syncService = {
  async submitEvents(userId: string, events: any[]) {
    const results: any[] = [];
    for (const event of events) {
      const existing = await syncRepository.findByClientTxnId(userId, event.clientTxnId);
      if (existing && existing.status === 'SUCCESS') {
        results.push({ clientTxnId: event.clientTxnId, status: 'DUPLICATE', syncEventId: existing.id });
        continue;
      }
      if (existing && existing.status === 'CONFLICT') {
        results.push({ clientTxnId: event.clientTxnId, status: 'CONFLICT', syncEventId: existing.id });
        continue;
      }
      try {
        const entityId = await this.processEvent(userId, event);
        const se = await syncRepository.create({
          user: { connect: { id: userId } }, deviceId: event.deviceId, clientTxnId: event.clientTxnId,
          entityType: event.entityType, entityId, operation: event.operation, payload: event.payload,
          status: 'SUCCESS', processedAt: new Date()
        });
        results.push({ clientTxnId: event.clientTxnId, status: 'SUCCESS', syncEventId: se.id, entityId });
      } catch (err: any) {
        logger.warn('Sync event failed', { clientTxnId: event.clientTxnId, error: err.message });
        const status = (err.code === 'TRANSACTION_DUPLICATE_CLIENT_ID' || err.code === 'BUDGET_ALREADY_EXISTS') ? 'CONFLICT' : 'FAILED';
        const se = await syncRepository.create({
          user: { connect: { id: userId } }, deviceId: event.deviceId, clientTxnId: event.clientTxnId,
          entityType: event.entityType, entityId: '', operation: event.operation, payload: event.payload, status
        });
        if (status === 'FAILED') await syncRepository.incrementRetry(se.id);
        results.push({ clientTxnId: event.clientTxnId, status, syncEventId: se.id });
      }
    }
    return { processed: results.length, results };
  },

  async processEvent(userId: string, event: any): Promise<string> {
    const { entityType, operation, payload } = event;
    if (entityType === 'TRANSACTION') {
      if (operation === 'CREATE') {
        const cat = await categoryRepository.findById(payload.categoryId);
        if (!cat || cat.userId !== userId) throw AppError.validation('TRANSACTION_CATEGORY_MISMATCH', [{ message: 'Category not found' }]);
        const txn = await transactionRepository.create({
          user: { connect: { id: userId } }, category: { connect: { id: payload.categoryId } },
          type: payload.type, amount: payload.amount, occurredAt: new Date(payload.occurredAt),
          title: payload.title, note: payload.note || null, merchant: payload.merchant || null,
          tags: payload.tags || null, clientTxnId: payload.clientTxnId, currencyCode: 'CNY'
        });
        return txn.id;
      }
      if (operation === 'UPDATE') { const t = await transactionRepository.update(payload.id, payload); return t.id; }
      if (operation === 'DELETE') { await transactionRepository.softDelete(payload.id); return payload.id; }
    }
    if (entityType === 'CATEGORY' && operation === 'CREATE') {
      const c = await categoryRepository.create({
        user: { connect: { id: userId } }, name: payload.name, icon: payload.icon || 'more_horiz',
        color: payload.color || '#9CA3AF', transactionType: payload.transactionType || 'EXPENSE', isSystem: false, sortOrder: 0
      });
      return c.id;
    }
    if (entityType === 'BUDGET' && operation === 'CREATE') {
      const b = await budgetRepository.create({
        user: { connect: { id: userId } }, periodType: payload.periodType || 'MONTHLY', year: payload.year,
        month: payload.month, categoryId: payload.categoryId || null, amount: payload.amount, currencyCode: 'CNY'
      });
      return b.id;
    }
    throw AppError.validation('VALIDATION_ERROR', [{ message: 'Unsupported sync operation' }]);
  },

  async listEvents(userId: string, status?: string) {
    return syncRepository.findByUser(userId, status ? { status } : undefined);
  },
  async getConflicts(userId: string) { return syncRepository.getConflicts(userId); },
  async resolveConflict(userId: string, syncEventId: string, resolution: string) {
    const event = await syncRepository.findById(syncEventId);
    if (!event || event.userId !== userId) throw AppError.notFound('Sync event not found');
    if (event.status !== 'CONFLICT') throw AppError.validation('VALIDATION_ERROR', [{ message: 'Not a conflict' }]);
    if (resolution === 'accept_client') {
      await this.processEvent(userId, { entityType: event.entityType, operation: event.operation, payload: event.payload });
    }
    await syncRepository.updateStatus(syncEventId, 'SUCCESS');
    return { syncEventId, resolution, status: 'SUCCESS' };
  }
};
