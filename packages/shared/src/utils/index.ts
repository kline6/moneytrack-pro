import { MONEY_MINOR_UNITS, MONEY_DECIMAL_DISPLAY } from '../constants';

export function toMinorUnits(yuan: number): number {
  return Math.round(yuan * MONEY_MINOR_UNITS);
}

export function toDisplayAmount(minorUnits: number): number {
  return minorUnits / MONEY_MINOR_UNITS;
}

export function formatCurrency(minorUnits: number, currencyCode = 'CNY'): string {
  const value = minorUnits / MONEY_MINOR_UNITS;
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: MONEY_DECIMAL_DISPLAY,
    maximumFractionDigits: MONEY_DECIMAL_DISPLAY
  }).format(value);
}

export function clampPage(page: number): number {
  return Math.max(1, Math.floor(page));
}

export function clampPageSize(pageSize: number, max = 100): number {
  return Math.min(Math.max(1, Math.floor(pageSize)), max);
}

export function computeTotalPages(totalItems: number, pageSize: number): number {
  if (pageSize <= 0) return 0;
  return Math.ceil(totalItems / pageSize);
}

export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isValidISODateString(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}
