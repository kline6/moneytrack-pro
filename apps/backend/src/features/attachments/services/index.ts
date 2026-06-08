import { attachmentRepository } from '../repositories';
import { transactionRepository } from '../../transactions/repositories';
import { AppError } from '../../../errors';
import { getStorageKey, deleteFile } from '../../../infrastructure/storage';
import { ATTACHMENT_MAX_COUNT } from '@moneytrack/shared';

export const attachmentService = {
  async upload(userId: string, transactionId: string, file: any) {
    const txn = await transactionRepository.findById(transactionId);
    if (!txn || txn.userId !== userId) throw AppError.notFound('Transaction not found');
    const count = await attachmentRepository.countByTransaction(transactionId);
    if (count >= ATTACHMENT_MAX_COUNT) throw AppError.validation('FILE_TOO_LARGE', [{ message: 'Max ' + ATTACHMENT_MAX_COUNT + ' attachments' }]);
    const storageKey = getStorageKey(userId, file.originalname);
    return attachmentRepository.create({ user: { connect: { id: userId } }, transaction: { connect: { id: transactionId } }, storageKey, originalName: file.originalname, mimeType: file.mimetype, sizeBytes: file.size });
  },
  async list(userId: string, transactionId: string) { const t = await transactionRepository.findById(transactionId); if (!t || t.userId !== userId) throw AppError.notFound('Not found'); return attachmentRepository.findByTransaction(transactionId); },
  async getById(userId: string, id: string) { const a = await attachmentRepository.findById(id); if (!a || a.userId !== userId) throw AppError.notFound('Not found'); return a; },
  async delete(userId: string, id: string) { const a = await attachmentRepository.findById(id); if (!a || a.userId !== userId) throw AppError.notFound('Not found'); deleteFile(a.storageKey); return attachmentRepository.softDelete(id); }
};
