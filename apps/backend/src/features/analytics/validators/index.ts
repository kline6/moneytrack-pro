import { z } from 'zod';
import { yearSchema, monthSchema } from '@moneytrack/shared';

export const monthlyAnalyticsSchema = z.object({
  year: yearSchema,
  month: monthSchema
});

export const weeklyAnalyticsSchema = z.object({
  year: yearSchema,
  week: z.coerce.number().int().min(1).max(53)
});

export const trendAnalyticsSchema = z.object({
  year: yearSchema,
  months: z.coerce.number().int().min(1).max(12).default(6)
});