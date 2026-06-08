const bcrypt: any = require('bcryptjs');
import jwt from 'jsonwebtoken';
import { authConfig } from '../../../config';
import { authRepository } from '../repositories';
import { seedSystemCategories } from '../../../db/prisma';
import { prisma } from '../../../db/prisma';
import { AppError } from '../../../errors';
import { logger } from '../../../infrastructure/logger';

const SALT_ROUNDS = 12;
export const authService = {
  async register(input: { email: string; password: string; displayName: string }) {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) throw AppError.conflict('AUTH_EMAIL_ALREADY_EXISTS', 'Email already registered');
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await authRepository.create({ email: input.email, passwordHash, displayName: input.displayName });
    await seedSystemCategories(prisma, user.id);
    logger.info('New user registered', { userId: user.id });
    return { user: { id: user.id, email: user.email, displayName: user.displayName }, accessToken: this.generateToken(user.id, user.email) };
  },
  async login(input: { email: string; password: string }) {
    const user = await authRepository.findByEmail(input.email);
    if (!user || user.status !== 'ACTIVE') throw AppError.validation('AUTH_INVALID_CREDENTIALS', undefined);
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw AppError.validation('AUTH_INVALID_CREDENTIALS', undefined);
    await authRepository.updateLastLogin(user.id);
    await seedSystemCategories(prisma, user.id);
    return { user: { id: user.id, email: user.email, displayName: user.displayName }, accessToken: this.generateToken(user.id, user.email) };
  },
  async getProfile(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user || user.status !== 'ACTIVE') throw AppError.notFound('User not found');
    return { id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt };
  },
  generateToken(userId: string, email: string): string {
    return jwt.sign({ sub: userId, email }, authConfig.accessTokenSecret, { expiresIn: authConfig.accessTokenExpiresIn } as jwt.SignOptions);
  }
};
