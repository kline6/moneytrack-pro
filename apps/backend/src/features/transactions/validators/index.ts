import { z } from 'zod';
import {
  paginationSchema,
  moneyAmountSchema,
  titleSchema,
  noteSchema,
  merchantSchema,
  tagsSchema,
  clientTxnIdSchema,
  idSchema
} from '@moneytrack/shared';

export const createTransactionSchema = z.object({
  categoryId: idSchema,
  type: z.enum(['EXPENSE', 'INCOME']),
  amount: moneyAmountSchema,
  occurredAt: z.string().datetime({ offset: true }),
  title: titleSchema,
  note: noteSchema,
  merchant: merchantSchema,
  tags: tagsSchema,
  clientTxnId: clientTxnIdSchema
});

export const updateTransactionSchema = z.object({
  categoryId: idSchema.optional(),
  amount: moneyAmountSchema.optional(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
  title: titleSchema.optional(),
  note: noteSchema,
  merchant: merchantSchema,
  tags: tagsSchema
});

const dateRangeFields = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional()
});

export const listTransactionSchema = paginationSchema
  .extend({
    type: z.enum(['EXPENSE', 'INCOME']).optional(),
    categoryId: idSchema.optional(),
    from: z.string().optional(),
    to: z.string().optional()
  });

export const transactionIdParamSchema = z.object({ id: idSchema });
