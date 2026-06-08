import { Request, Response } from 'express';
import { transactionService } from '../services';
import { sendSuccess, sendCreated, sendNoContent, asyncHandler } from '../../../utils';

export const listTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, sortBy, sortOrder, query, type, categoryId, from, to } = req.query as any;
  const result = await transactionService.list(req.userId!, {
    page: Number(page) || 1,
    pageSize: Number(pageSize) || 20,
    sortBy,
    sortOrder,
    query,
    type,
    categoryId,
    from,
    to
  });
  sendSuccess(res, result.items, 200, result.meta as any);
});

export const getTransaction = asyncHandler(async (req: Request, res: Response) => {
  const txn = await transactionService.getById(req.userId!, req.params.id);
  sendSuccess(res, txn);
});

export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
  const txn = await transactionService.create(req.userId!, req.body);
  sendCreated(res, txn);
});

export const updateTransaction = asyncHandler(async (req: Request, res: Response) => {
  const txn = await transactionService.update(req.userId!, req.params.id, req.body);
  sendSuccess(res, txn);
});

export const deleteTransaction = asyncHandler(async (req: Request, res: Response) => {
  await transactionService.delete(req.userId!, req.params.id);
  sendNoContent(res);
});

export const batchUpdateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { ids, categoryId } = req.body;
  const results = await transactionService.batchUpdateCategory(req.userId!, ids, categoryId);
  sendSuccess(res, results);
});

export const batchDelete = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;
  const results = await transactionService.batchDelete(req.userId!, ids);
  sendSuccess(res, results);
});

export const mergeTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { primaryId, secondaryId } = req.body;
  const result = await transactionService.mergeTransactions(req.userId!, primaryId, secondaryId);
  sendSuccess(res, result);
});