import type { PageMeta } from '@moneytrack/shared';

export function buildPageMeta(page: number, pageSize: number, totalItems: number): PageMeta {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: pageSize > 0 ? Math.ceil(totalItems / pageSize) : 0
  };
}

export function computeSkip(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}