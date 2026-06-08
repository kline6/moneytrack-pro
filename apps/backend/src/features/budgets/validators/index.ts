import { z } from 'zod';
import { moneyAmountSchema, idSchema, monthSchema, yearSchema } from '@moneytrack/shared';
export const createBudgetSchema = z.object({ periodType: z.enum(['MONTHLY', 'WEEKLY']), year: yearSchema, month: monthSchema, weekStart: z.string().datetime({ offset: true }).optional(), categoryId: idSchema.optional().nullable(), amount: moneyAmountSchema });
export const updateBudgetSchema = z.object({ amount: moneyAmountSchema });
export const listBudgetSchema = z.object({ year: yearSchema, month: monthSchema.optional(), periodType: z.enum(['MONTHLY', 'WEEKLY']).optional() });
export const annualBudgetSchema = z.object({ year: yearSchema });
export const budgetIdParamSchema = z.object({ id: idSchema });
