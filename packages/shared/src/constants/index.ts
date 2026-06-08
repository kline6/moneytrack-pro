export const APP_NAME = 'MoneyTrack Pro';
export const APP_DEFAULT_LOCALE = 'zh-CN';
export const APP_DEFAULT_CURRENCY = 'CNY';
export const MONEY_DECIMAL_DISPLAY = 2;
export const MONEY_MINOR_UNITS = 100;

export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_MAX = 100;
export const SEARCH_QUERY_MAX_LENGTH = 120;
export const NOTE_MAX_LENGTH = 500;
export const TITLE_MAX_LENGTH = 120;
export const MERCHANT_MAX_LENGTH = 120;
export const TAG_NAME_MAX_LENGTH = 40;
export const TAGS_MAX_COUNT = 10;
export const ATTACHMENT_MAX_COUNT = 5;

export const DATE_RANGE_MIN_DAYS = 1;
export const DATE_RANGE_MAX_DAYS = 400;
export const EXPORT_MAX_ROWS = 10000;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  TRANSACTION_DUPLICATE_CLIENT_ID: 'TRANSACTION_DUPLICATE_CLIENT_ID',
  TRANSACTION_CATEGORY_MISMATCH: 'TRANSACTION_CATEGORY_MISMATCH',
  BUDGET_ALREADY_EXISTS: 'BUDGET_ALREADY_EXISTS',
  BUDGET_EXCEEDED: 'BUDGET_EXCEEDED',
  EXPORT_TOO_LARGE: 'EXPORT_TOO_LARGE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SYSTEM_UNEXPECTED_ERROR: 'SYSTEM_UNEXPECTED_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const ENTITY_TYPES = {
  USER: 'USER',
  CATEGORY: 'CATEGORY',
  TRANSACTION: 'TRANSACTION',
  BUDGET: 'BUDGET',
  ATTACHMENT: 'ATTACHMENT',
  SYNC_EVENT: 'SYNC_EVENT'
} as const;

export const TRANSACTION_TYPES = {
  EXPENSE: 'EXPENSE',
  INCOME: 'INCOME'
} as const;

export const BUDGET_PERIOD_TYPES = {
  MONTHLY: 'MONTHLY',
  WEEKLY: 'WEEKLY'
} as const;

export const SYNC_STATUSES = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CONFLICT: 'CONFLICT'
} as const;

export const USER_STATUSES = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED'
} as const;

export const SYSTEM_INCOME_CATEGORY_SEEDS = [
  { name: '工资', icon: 'cash', color: '#10B981' },
  { name: '奖金', icon: 'gift', color: '#F59E0B' },
  { name: '投资收益', icon: 'trending-up', color: '#3B82F6' },
  { name: '兼职', icon: 'briefcase', color: '#8B5CF6' },
  { name: '红包', icon: 'wallet', color: '#EF4444' },
  { name: '理财', icon: 'trending_up', color: '#059669' },
  { name: '礼物', icon: 'card_giftcard', color: '#EC4899' },
  { name: '报销', icon: 'receipt', color: '#14B8A6' },
  { name: '租金', icon: 'home', color: '#D97706' },
  { name: '资助', icon: 'heart', color: '#F472B6' },
  { name: '利息', icon: 'logo-usd', color: '#0EA5E9' },
  { name: '中奖', icon: 'trophy', color: '#A855F7' },
  { name: '转账', icon: 'swap-horizontal', color: '#6366F1' },
  { name: '刑事赔偿', icon: 'shield-checkmark', color: '#64748B' },
  { name: '其它', icon: 'ellipsis-horizontal', color: '#9CA3AF' },
] as const;

export const SYSTEM_CATEGORY_SEEDS = [
  { name: '餐饮', icon: 'food', color: '#EF4444' },
  { name: '购物', icon: 'shopping_bag', color: '#F59E0B' },
  { name: '交通', icon: 'directions_car', color: '#3B82F6' },
  { name: '娱乐', icon: 'sports_esports', color: '#8B5CF6' },
  { name: '学习', icon: 'school', color: '#0EA5E9' },
  { name: '医疗', icon: 'local_hospital', color: '#10B981' },
  { name: '住房', icon: 'house', color: '#D97706' },
  { name: '旅游', icon: 'flight', color: '#14B8A6' },
  { name: '宠物', icon: 'pets', color: '#F472B6' },
  { name: '数码', icon: 'devices', color: '#6366F1' },
  { name: '服饰', icon: 'checkroom', color: '#A855F7' },
  { name: '礼物', icon: 'card_giftcard', color: '#EC4899' },
  { name: '保险', icon: 'shield', color: '#64748B' },
  { name: '投资', icon: 'trending_up', color: '#059669' },
  { name: '其它', icon: 'more_horiz', color: '#9CA3AF' }
] as const;
