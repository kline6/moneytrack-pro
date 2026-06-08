import { Request, Response } from 'express';
import { aiService } from '../services';
import { sendSuccess, asyncHandler } from '../../../utils';

export const getMonthlyReport = asyncHandler(async (req: Request, res: Response) => {
  const { year, month } = req.query as any;
  const report = await aiService.generateMonthlyReport(req.userId!, Number(year), Number(month));
  sendSuccess(res, report);
});

export const askQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { question, year, month } = req.body;
  const result = await aiService.answerQuestion(req.userId!, question, year, month);
  sendSuccess(res, result);
});
