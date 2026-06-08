import { Request, Response } from 'express';
import { exportService } from '../services';
import { asyncHandler } from '../../../utils';
export const exportTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { format, type, categoryId, from, to } = req.query as any;
  const r = await exportService.exportTransactions(req.userId!, { format, type, categoryId, from, to });
  res.setHeader('Content-Type', r.contentType);
  res.setHeader('Content-Disposition', 'attachment; filename="' + r.filename + '"');
  res.status(200).send(r.data);
});
