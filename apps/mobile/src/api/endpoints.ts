import { apiClient, ApiResponse } from './client';

export const authApi = {
  register: (data: { email: string; password: string; displayName: string }) =>
    apiClient.post<ApiResponse<any>>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post<ApiResponse<any>>('/auth/login', data),
  getProfile: () =>
    apiClient.get<ApiResponse<any>>('/auth/me'),
};

export const categoriesApi = {
  list: (transactionType?: string) =>
    apiClient.get<ApiResponse<any[]>>('/categories', { params: { transactionType } }),
  create: (data: any) =>
    apiClient.post<ApiResponse<any>>('/categories', data),
  update: (id: string, data: any) =>
    apiClient.patch<ApiResponse<any>>('/categories/' + id, data),
  delete: (id: string) =>
    apiClient.delete('/categories/' + id),
};

export const transactionsApi = {
  list: (params: any) =>
    apiClient.get<ApiResponse<any[]>>('/transactions', { params }),
  create: (data: any) =>
    apiClient.post<ApiResponse<any>>('/transactions', data),
  update: (id: string, data: any) =>
    apiClient.patch<ApiResponse<any>>('/transactions/' + id, data),
  delete: (id: string) =>
    apiClient.delete('/transactions/' + id),
  batchDelete: (ids: string[]) =>
    apiClient.post<ApiResponse<any>>('/transactions/batch-delete', { ids }),
  batchUpdateCategory: (ids: string[], categoryId: string) =>
    apiClient.post<ApiResponse<any>>('/transactions/batch-update-category', { ids, categoryId }),
  merge: (primaryId: string, secondaryId: string) =>
    apiClient.post<ApiResponse<any>>('/transactions/merge', { primaryId, secondaryId }),
};

export const budgetsApi = {
  list: (params: any) =>
    apiClient.get<ApiResponse<any[]>>('/budgets', { params }),
  summary: (params: any) =>
    apiClient.get<ApiResponse<any>>('/budgets/summary', { params }),
  annual: (params: any) =>
    apiClient.get<ApiResponse<any>>('/budgets/annual', { params }),
  create: (data: any) =>
    apiClient.post<ApiResponse<any>>('/budgets', data),
  update: (id: string, data: any) =>
    apiClient.patch<ApiResponse<any>>('/budgets/' + id, data),
  delete: (id: string) =>
    apiClient.delete('/budgets/' + id),
};

export const analyticsApi = {
  dashboard: () =>
    apiClient.get<ApiResponse<any>>('/analytics/dashboard'),
  monthly: (params: { year: number; month: number }) =>
    apiClient.get<ApiResponse<any>>('/analytics/monthly', { params }),
  trend: (params: { year: number; months?: number }) =>
    apiClient.get<ApiResponse<any>>('/analytics/trend', { params }),
  smartInsights: (viewType: 'day' | 'week' | 'month') =>
    apiClient.get<ApiResponse<any>>('/analytics/smart-insights', { params: { viewType } }),
};

export const aiApi = {
  report: (params: { year: number; month: number }) => apiClient.get('/ai/report', { params }),
  ask: (data: { question: string; year?: number; month?: number }) => apiClient.post('/ai/ask', data),
};

export const smartApi = {
  suggestions: () => apiClient.get<ApiResponse<any>>('/smart/suggestions'),
  predict: (data: { rawText: string; source?: string }) => apiClient.post<ApiResponse<any>>('/smart/predict', data),
  updateWeight: (data: { merchant: string; categoryId: string }) => apiClient.post<ApiResponse<any>>('/smart/update-weight', data),
  parseTitle: (input: string) => apiClient.post<ApiResponse<any>>('/smart/parse-title', { input }),
};

export const syncApi = {
  submit: (events: any[]) => apiClient.post('/sync/submit', { events }),
  list: (status?: string) => apiClient.get('/sync/events', { params: { status } }),
  conflicts: () => apiClient.get('/sync/conflicts'),
  resolve: (data: { syncEventId: string; resolution: string }) => apiClient.post('/sync/resolve', data),
};

export const attachmentsApi = {
  upload: (transactionId: string, formData: FormData) => apiClient.post('/attachments', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list: (transactionId: string) => apiClient.get('/attachments/transaction/' + transactionId),
  delete: (id: string) => apiClient.delete('/attachments/' + id),
};

export const exportsApi = {
  transactions: (params: any) =>
    apiClient.get('/exports/transactions', { params, responseType: 'blob' }),
};