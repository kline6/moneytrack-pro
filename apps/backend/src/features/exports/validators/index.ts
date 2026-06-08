import { z } from 'zod';
import { idSchema } from '@moneytrack/shared';
export const exportTransactionsSchema = z.object({ format: z.enum(['csv', 'excel']).default('csv'), type: z.enum(['EXPENSE', 'INCOME']).optional(), categoryId: idSchema.optional(), from: z.string().optional(), to: z.string().optional() });
