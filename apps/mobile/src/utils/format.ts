export function formatMoney(minorUnits: number, currency = 'CNY'): string {
  const value = minorUnits / 100;
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: string | Date, pattern = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  if (pattern === 'yyyy-MM-dd') return year + '-' + month + '-' + day;
  if (pattern === 'MM/dd') return month + '/' + day;
  return year + '-' + month + '-' + day;
}

export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}
