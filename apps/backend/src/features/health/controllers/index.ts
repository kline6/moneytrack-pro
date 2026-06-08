import { Request, Response } from 'express';
import { prisma } from '../../../db/prisma';
import { sendSuccess } from '../../../utils';

export async function healthCheck(_req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    sendSuccess(res, { status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({
      success: false,
      data: null,
      meta: null,
      error: { code: 'SYSTEM_UNEXPECTED_ERROR', message: 'Service unhealthy' }
    });
  }
}
