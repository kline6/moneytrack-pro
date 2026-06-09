import 'dotenv/config';
import { execSync } from 'child_process';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { appConfig } from './config';
import { logger } from './infrastructure/logger';
import { prisma } from './db/prisma';
import { apiRoutes } from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { rateLimiter } from './middlewares/rateLimiter';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

app.use('/api/v1', apiRoutes);

app.use(errorHandler);

async function bootstrap() {
  try {
    // Run prisma db push to ensure database tables exist
    logger.info('Running database migration...');
    try {
      const output = execSync('npx prisma db push --schema prisma/schema.prisma --skip-generate --accept-data-loss', {
        encoding: 'utf8',
        timeout: 60000,
        stdio: 'pipe'
      });
      logger.info('Database migration completed', { output: output.trim().substring(0, 200) });
    } catch (migrateError: any) {
      logger.error('Database migration failed, continuing anyway', { error: migrateError.message?.substring(0, 300) });
    }

    await prisma.$connect();
    logger.info('Database connected');

    app.listen(appConfig.port, () => {
      logger.info('MoneyTrack Pro API running on port ' + appConfig.port + ' [' + appConfig.nodeEnv + ']');
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

bootstrap();

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});