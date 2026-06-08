import { z } from 'zod';
import { idSchema } from '@moneytrack/shared';

export const createAttachmentSchema = z.object({
  transactionId: idSchema
});

export const attachmentIdParamSchema = z.object({ id: idSchema });
