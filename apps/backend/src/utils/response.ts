import { Response } from 'express';
import type { ApiResponse } from '@moneytrack/shared';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta?: Record<string, unknown>) {
  const body: ApiResponse<T> = { success: true, data, meta: meta ?? null, error: null };
  return res.status(statusCode).json(body);
}

export function sendCreated<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  return sendSuccess(res, data, 201, meta);
}

export function sendNoContent(res: Response) {
  return res.status(204).send();
}