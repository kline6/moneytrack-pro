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

async function runMigration(): Promise<boolean> {
  try {
    // Find prisma binary at /app/node_modules/prisma/build/index.js
    const prismaBin = '/app/node_modules/prisma/build/index.js';
    const schemaPath = '/app/apps/backend/prisma/schema.prisma';
    logger.info('Running database migration', { prismaBin, schemaPath });

    const output = execSync(
      `node "${prismaBin}" db push --schema "${schemaPath}" --skip-generate --accept-data-loss`,
      {
        encoding: 'utf8',
        timeout: 120000,
        stdio: 'pipe',
        cwd: '/app'
      }
    );
    logger.info('Migration output', { output: output.trim().substring(0, 500) });
    return true;
  } catch (err: any) {
    logger.error('Migration failed', {
      message: err.message?.substring(0, 500),
      stderr: err.stderr?.substring(0, 500)
    });
    return false;
  }
}

async function bootstrap() {
  try {
    const migrationOk = await runMigration();
    if (!migrationOk) {
      logger.warn('Migration had issues, attempting to continue...');
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