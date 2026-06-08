import type { ErrorCode } from '@moneytrack/shared';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: { field?: string; message: string; rule?: string }[];
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: { field?: string; message: string; rule?: string }[],
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static validation(message: string, details?: { field?: string; message: string; rule?: string }[]) {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
  }

  static notFound(message = '资源不存在') {
    return new AppError(404, 'RESOURCE_NOT_FOUND', message);
  }

  static unauthorized(message = '未授权') {
    return new AppError(401, 'AUTH_TOKEN_MISSING', message);
  }

  static forbidden(message = '无权访问') {
    return new AppError(403, 'AUTH_FORBIDDEN', message);
  }

  static conflict(code: ErrorCode, message: string) {
    return new AppError(409, code, message);
  }

  static internal(message = '服务器内部错误') {
    return new AppError(500, 'SYSTEM_UNEXPECTED_ERROR', message, undefined, false);
  }
}