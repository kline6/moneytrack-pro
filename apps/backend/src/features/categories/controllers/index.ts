import { Request, Response } from 'express';
import { categoryService } from '../services';
import { sendSuccess, sendCreated, sendNoContent, asyncHandler } from '../../../utils';

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await categoryService.list(req.userId!, {
    transactionType: req.query.transactionType as string | undefined
  });
  sendSuccess(res, categories);
});

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getById(req.userId!, req.params.id);
  sendSuccess(res, category);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.create(req.userId!, req.body);
  sendCreated(res, category);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.update(req.userId!, req.params.id, req.body);
  sendSuccess(res, category);
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.delete(req.userId!, req.params.id);
  sendNoContent(res);
});