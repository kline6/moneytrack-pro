import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors';
import { logger } from '../infrastructure/logger';
import type { ApiResponse, ApiErrorDetail } from '@moneytrack/shared';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const details: ApiErrorDetail[] = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      rule: issue.code
    }));
    const body: ApiResponse<null> = {
      success: false,
      data: null,
      meta: null,
      error: { code: 'VALIDATION_ERROR', message: '请求参数校验失败', details }
    };
    return res.status(400).json(body);
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational error', { error: err.message, stack: err.stack });
    }
    const body: ApiResponse<null> = {
      success: false,
      data: null,
      meta: null,
      error: { code: err.code, message: err.message, details: err.details }
    };
    return res.status(err.statusCode).json(body);
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack, name: err.name });
  const body: ApiResponse<null> = {
    success: false,
    data: null,
    meta: null,
    error: { code: 'SYSTEM_UNEXPECTED_ERROR', message: err.message || '服务器内部错误' }
  };
  return res.status(500).json(body);
}