import { z } from 'zod';
import { idSchema } from '@moneytrack/shared';

export const batchUpdateCategorySchema = z.object({
  ids: z.array(idSchema).min(1).max(100),
  categoryId: idSchema,
});

export const batchDeleteSchema = z.object({
  ids: z.array(idSchema).min(1).max(100),
});

export const mergeTransactionsSchema = z.object({
  primaryId: idSchema,
  secondaryId: idSchema,
});