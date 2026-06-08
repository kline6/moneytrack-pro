import { Request, Response } from 'express';
import { smartService } from '../services';
import { sendSuccess, asyncHandler } from '../../../utils';

export const getQuickSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const data = await smartService.getQuickSuggestions(req.userId!);
  sendSuccess(res, data);
});

export const predictCategory = asyncHandler(async (req: Request, res: Response) => {
  const { rawText, source } = req.body;
  const data = await smartService.predictCategoryAndMerchant(req.userId!, rawText, source);
  sendSuccess(res, data);
});

export const updateRuleWeight = asyncHandler(async (req: Request, res: Response) => {
  const { merchant, categoryId } = req.body;
  await smartService.updateRuleWeight(req.userId!, merchant, categoryId);
  sendSuccess(res, { updated: true });
});

export const parseTitle = asyncHandler(async (req: Request, res: Response) => {
  const { input } = req.body;
  const result = smartService.parseTitleInput(input || '');
  sendSuccess(res, result);
});