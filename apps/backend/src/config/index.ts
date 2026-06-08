import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function requiredString(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) throw new Error('Missing required env variable: ' + key);
  return value;
}
function optionalString(key: string, fallback = ''): string { return process.env[key] ?? fallback; }
function requiredInt(key: string, fallback?: number): number {
  const raw = process.env[key]; const value = raw ? Number(raw) : fallback;
  if (value === undefined || Number.isNaN(value)) throw new Error('Missing or invalid numeric env variable: ' + key);
  return value;
}

export const appConfig = {
  nodeEnv: optionalString('NODE_ENV', 'development'),
  port: requiredInt('PORT', 4000),
  defaultCurrency: optionalString('APP_DEFAULT_CURRENCY', 'CNY'),
  uploadMaxBytes: requiredInt('UPLOAD_MAX_BYTES', 5 * 1024 * 1024),
  uploadDir: optionalString('UPLOAD_DIR', 'uploads'),
  rateLimitWindowMs: requiredInt('RATE_LIMIT_WINDOW_MS', 60_000),
  rateLimitMax: requiredInt('RATE_LIMIT_MAX', 120)
};
export const databaseConfig = { url: requiredString('DATABASE_URL') };
export const authConfig = { accessTokenSecret: requiredString('JWT_ACCESS_SECRET'), accessTokenExpiresIn: optionalString('JWT_ACCESS_EXPIRES_IN', '15m') };
export const aiConfig = { provider: optionalString('AI_PROVIDER', 'local'), apiKey: optionalString('AI_API_KEY', ''), model: optionalString('AI_MODEL', 'gpt-4o-mini'), baseUrl: optionalString('AI_BASE_URL', 'https://api.openai.com/v1') };
