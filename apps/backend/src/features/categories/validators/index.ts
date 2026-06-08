import { z } from 'zod';
import { paginationSchema, idSchema } from '@moneytrack/shared';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, '分类名称不能为空').max(60, '分类名称不能超过60个字符'),
  icon: z.string().trim().min(1).max(60),
  color: z.string().trim().min(1).max(20),
  transactionType: z.enum(['EXPENSE', 'INCOME']),
  sortOrder: z.number().int().min(0).optional()
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  icon: z.string().trim().min(1).max(60).optional(),
  color: z.string().trim().min(1).max(20).optional(),
  sortOrder: z.number().int().min(0).optional()
});

export const listCategorySchema = paginationSchema.extend({
  transactionType: z.enum(['EXPENSE', 'INCOME']).optional()
});

export const categoryIdParamSchema = z.object({ id: idSchema });