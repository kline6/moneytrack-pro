import { z } from 'zod';
import { clientTxnIdSchema, idSchema } from '@moneytrack/shared';

export const syncEventSchema = z.object({
  deviceId: z.string().trim().min(1).max(64),
  clientTxnId: clientTxnIdSchema,
  entityType: z.enum(['TRANSACTION', 'CATEGORY', 'BUDGET']),
  operation: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  payload: z.record(z.unknown())
});

export const syncBatchSchema = z.object({
  events: z.array(syncEventSchema).min(1).max(50)
});

export const resolveConflictSchema = z.object({
  syncEventId: idSchema,
  resolution: z.enum(['accept_server', 'accept_client', 'merge']),
  mergedPayload: z.record(z.unknown()).optional()
});
