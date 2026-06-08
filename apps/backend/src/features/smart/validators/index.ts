import { z } from 'zod';
import { idSchema } from '@moneytrack/shared';

export const predictCategorySchema = z.object({
  rawText: z.string().trim().min(1).max(200),
  source: z.enum(['wechat', 'alipay']).optional(),
});

export const updateRuleWeightSchema = z.object({
  merchant: z.string().trim().min(1).max(120),
  categoryId: idSchema,
});

export const parseTitleSchema = z.object({
  input: z.string().trim().min(1).max(200),
});