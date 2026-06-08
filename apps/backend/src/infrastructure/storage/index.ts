import path from 'path';
import fs from 'fs';
import { appConfig } from '../../config';
import { logger } from '../logger';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    logger.info('Created upload directory: ' + UPLOAD_DIR);
  }
}

export function getStorageKey(userId: string, filename: string): string {
  const ext = path.extname(filename);
  const date = new Date().toISOString().slice(0, 10);
  return userId + '/' + date + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;
}

export function getFullPath(storageKey: string): string {
  return path.join(UPLOAD_DIR, storageKey);
}

export function deleteFile(storageKey: string): void {
  const fullPath = getFullPath(storageKey);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

export { UPLOAD_DIR };
