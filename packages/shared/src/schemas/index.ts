import { z } from 'zod';
import {
  DATE_RANGE_MAX_DAYS,
  NOTE_MAX_LENGTH,
  PAGE_SIZE_MAX,
  SEARCH_QUERY_MAX_LENGTH,
  TAG_NAME_MAX_LENGTH,
  TAGS_MAX_COUNT,
  TITLE_MAX_LENGTH,
  MERCHANT_MAX_LENGTH
} from '../constants';

export const emailSchema = z
  .string()
  .trim()
  .email('邮箱格式不合法')
  .max(254, '邮箱长度不能超过254个字符');

export const passwordSchema = z
  .string()
  .min(8, '密码长度至少8位')
  .max(128, '密码长度不能超过128位')
  .regex(/[A-Za-z]/, '密码必须包含字母')
  .regex(/[0-9]/, '密码必须包含数字');

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, '昵称不能为空')
  .max(50, '昵称长度不能超过50个字符');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX).default(20),
  sortBy: z.string().trim().max(64).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  query: z.string().trim().max(SEARCH_QUERY_MAX_LENGTH).optional()
});

export const dateRangeSchema = z
  .object({
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional()
  })
  .refine(
    (value) => {
      if (!value.from || !value.to) return true;
      return new Date(value.from).getTime() <= new Date(value.to).getTime();
    },
    { message: '开始时间不能晚于结束时间' }
  )
  .refine(
    (value) => {
      if (!value.from || !value.to) return true;
      const from = new Date(value.from);
      const to = new Date(value.to);
      const diffDays =
        (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= DATE_RANGE_MAX_DAYS;
    },
    { message: `查询时间范围不能超过${DATE_RANGE_MAX_DAYS}天` }
  );

export const moneyAmountSchema = z.coerce
  .number()
  .int('金额必须为整数分')
  .min(1, '金额必须大于0')
  .max(999999999, '金额超出允许范围');

export const titleSchema = z
  .string()
  .trim()
  .min(1, '用途不能为空')
  .max(TITLE_MAX_LENGTH, `用途长度不能超过${TITLE_MAX_LENGTH}个字符`);

export const optionalTitleSchema = z
  .string()
  .trim()
  .max(TITLE_MAX_LENGTH, `用途长度不能超过${TITLE_MAX_LENGTH}个字符`)
  .optional();

export const noteSchema = z
  .string()
  .trim()
  .max(NOTE_MAX_LENGTH, `备注长度不能超过${NOTE_MAX_LENGTH}个字符`)
  .optional();

export const merchantSchema = z
  .string()
  .trim()
  .max(MERCHANT_MAX_LENGTH, `商户名称长度不能超过${MERCHANT_MAX_LENGTH}个字符`)
  .optional();

export const tagSchema = z
  .string()
  .trim()
  .min(1)
  .max(TAG_NAME_MAX_LENGTH, `标签长度不能超过${TAG_NAME_MAX_LENGTH}个字符`);

export const tagsSchema = z
  .array(tagSchema)
  .max(TAGS_MAX_COUNT, `标签数量不能超过${TAGS_MAX_COUNT}个`)
  .optional();

export const idSchema = z.string().trim().uuid('主键格式不合法');
export const clientTxnIdSchema = z.string().trim().min(16).max(64);
export const optionalClientTxnIdSchema = clientTxnIdSchema.optional();

export const monthSchema = z.coerce.number().int().min(1).max(12);
export const yearSchema = z.coerce.number().int().min(2000).max(2100);
