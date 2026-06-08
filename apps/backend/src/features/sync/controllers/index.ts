import { Request, Response } from 'express';
import { syncService } from '../services';
import { sendSuccess, asyncHandler } from '../../../utils';

export const submitEvents = asyncHandler(async (req: Request, res: Response) => {
  const result = await syncService.submitEvents(req.userId!, req.body.events);
  sendSuccess(res, result);
});
export const listEvents = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await syncService.listEvents(req.userId!, (req.query as any).status));
});
export const getConflicts = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await syncService.getConflicts(req.userId!));
});
export const resolveConflict = asyncHandler(async (req: Request, res: Response) => {
  const { syncEventId, resolution } = req.body;
  sendSuccess(res, await syncService.resolveConflict(req.userId!, syncEventId, resolution));
});
