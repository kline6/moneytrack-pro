import rateLimit from 'express-rate-limit';
import { appConfig } from '../config';

export const rateLimiter = rateLimit({
  windowMs: appConfig.rateLimitWindowMs,
  max: appConfig.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    meta: null,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: '请求过于频繁，请稍后再试' }
  }
});