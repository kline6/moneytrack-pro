import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { sendSuccess, sendCreated } from '../../../utils';

export async function register(req: Request, res: Response) {
  const result = await authService.register(req.body);
  sendCreated(res, result);
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body);
  sendSuccess(res, result);
}

export async function getProfile(req: Request, res: Response) {
  const profile = await authService.getProfile(req.userId!);
  sendSuccess(res, profile);
}