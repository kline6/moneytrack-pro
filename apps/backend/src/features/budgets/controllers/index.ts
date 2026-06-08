import { Request, Response } from 'express';
import { budgetService } from '../services';
import { sendSuccess, sendCreated, sendNoContent, asyncHandler } from '../../../utils';

export const listBudgets = asyncHandler(async (req: Request, res: Response) => {
  const { year, month, periodType } = req.query as any;
  sendSuccess(res, await budgetService.list(req.userId!, { year: Number(year), month: month ? Number(month) : undefined, periodType }));
});
export const createBudget = asyncHandler(async (req: Request, res: Response) => { try { console.log('Creating budget:', JSON.stringify(req.body)); const result = await budgetService.create(req.userId!, req.body); console.log('Budget created:', result); sendCreated(res, result); } catch(err) { console.error('Budget create error:', err); throw err; } });
export const updateBudget = asyncHandler(async (req: Request, res: Response) => { sendSuccess(res, await budgetService.update(req.userId!, req.params.id, req.body)); });
export const deleteBudget = asyncHandler(async (req: Request, res: Response) => { await budgetService.delete(req.userId!, req.params.id); sendNoContent(res); });
export const getBudgetSummary = asyncHandler(async (req: Request, res: Response) => { const { year, month } = req.query as any; sendSuccess(res, await budgetService.getBudgetSummary(req.userId!, Number(year), Number(month))); });
export const getAnnualSummary = asyncHandler(async (req: Request, res: Response) => { const { year } = req.query as any; sendSuccess(res, await budgetService.getAnnualSummary(req.userId!, Number(year))); });
