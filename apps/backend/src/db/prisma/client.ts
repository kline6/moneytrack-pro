import { PrismaClient } from '@prisma/client';
import { databaseConfig } from '../../config';
import { logger } from '../../infrastructure/logger';

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: databaseConfig.url } }
  });
}

export const prisma: PrismaClient = globalForPrisma.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

prisma.$on('error' as never, (e: any) => logger.error('Prisma error', { target: e.target, message: e.message }));
prisma.$on('warn' as never, (e: any) => logger.warn('Prisma warn', { target: e.target, message: e.message }));
