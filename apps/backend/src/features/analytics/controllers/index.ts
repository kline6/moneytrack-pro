import { Request, Response } from 'express';
import { analyticsService } from '../services';
import { sendSuccess, asyncHandler } from '../../../utils';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await analyticsService.getDashboard(req.userId!);
  sendSuccess(res, data);
});

export const getMonthlyReport = asyncHandler(async (req: Request, res: Response) => {
  const { year, month } = req.query as any;
  const data = await analyticsService.getMonthlyReport(req.userId!, Number(year), Number(month));
  sendSuccess(res, data);
});

export const getTrend = asyncHandler(async (req: Request, res: Response) => {
  const { year, months } = req.query as any;
  const data = await analyticsService.getTrend(req.userId!, Number(year), Number(months) || 6);
  sendSuccess(res, data);
});

export const getSmartInsights = asyncHandler(async (req: Request, res: Response) => {
  const { viewType } = req.query as any;
  const data = await analyticsService.getSmartInsights(req.userId!, viewType || 'month');
  sendSuccess(res, data);
});