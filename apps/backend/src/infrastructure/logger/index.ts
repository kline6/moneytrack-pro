import winston from 'winston';
import { appConfig } from '../../config';

const isDev = appConfig.nodeEnv === 'development';

export const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    isDev
      ? winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }: any) => {
            const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
            return timestamp + ' [' + level + '] ' + message + metaStr;
          })
        )
      : winston.format.json()
  ),
  transports: [new winston.transports.Console()],
  defaultMeta: { service: 'moneytrack-backend' }
});
