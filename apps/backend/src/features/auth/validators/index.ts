import { z } from 'zod';
import { emailSchema, passwordSchema, displayNameSchema } from '@moneytrack/shared';

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '密码不能为空')
});