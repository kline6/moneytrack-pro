export type TransactionType = 'EXPENSE' | 'INCOME';
export type BudgetPeriodType = 'MONTHLY' | 'WEEKLY';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type SyncStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CONFLICT';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown> | null;
  error?: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  rule?: string;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PageRequest {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  query?: string;
}

export interface DateRangeRequest {
  from?: string;
  to?: string;
}

export interface MoneyAmount {
  amount: number;
  currencyCode: string;
}
