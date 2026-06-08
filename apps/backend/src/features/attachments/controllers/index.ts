import { Request, Response } from 'express';
import { attachmentService } from '../services';
import { sendSuccess, sendCreated, sendNoContent, asyncHandler } from '../../../utils';

export const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
  const file = (req as any).file;
  if (!file) return res.status(400).json({ success: false, data: null, meta: null, error: { code: 'VALIDATION_ERROR', message: 'Please select a file' } });
  const attachment = await attachmentService.upload(req.userId!, req.body.transactionId, file);
  sendCreated(res, attachment);
});

export const listAttachments = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await attachmentService.list(req.userId!, req.params.transactionId));
});
export const getAttachment = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await attachmentService.getById(req.userId!, req.params.id));
});
export const deleteAttachment = asyncHandler(async (req: Request, res: Response) => {
  await attachmentService.delete(req.userId!, req.params.id); sendNoContent(res);
});
