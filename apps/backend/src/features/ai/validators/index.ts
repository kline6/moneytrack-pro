import { z } from 'zod';
import { yearSchema, monthSchema } from '@moneytrack/shared';

export const aiMonthlyReportSchema = z.object({
  year: yearSchema,
  month: monthSchema
});

export const aiQuestionSchema = z.object({
  question: z.string().trim().min(1).max(500),
  year: yearSchema.optional(),
  month: monthSchema.optional()
});
