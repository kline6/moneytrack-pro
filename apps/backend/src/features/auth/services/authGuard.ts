import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '../../../config';
import { AppError } from '../../../errors';

interface JwtPayload {
  sub: string;
  email: string;
}

export function authGuard(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw AppError.unauthorized('缺少认证令牌');
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, authConfig.accessTokenSecret) as JwtPayload;
    req.userId = payload.sub;
    next();
  } catch {
    throw AppError.unauthorized('认证令牌无效或已过期');
  }
}