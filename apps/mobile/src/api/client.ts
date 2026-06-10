import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = __DEV__ ? 'http://10.0.2.2:4000/api/v1' : 'https://moneytrack-api-v2.onrender.com/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 90000,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 只在明确的认证失败时清除 token（排除网络错误和超时）
    if (error.response?.status === 401) {
      const code = error.response?.data?.error?.code;
      // AUTH_TOKEN_EXPIRED 或 AUTH_TOKEN_INVALID 才清除，其他 401 不清除
      if (code === 'AUTH_TOKEN_EXPIRED' || code === 'AUTH_TOKEN_INVALID' || code === 'AUTH_TOKEN_MISSING') {
        await AsyncStorage.removeItem('accessToken');
      }
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown> | null;
  error?: { code: string; message: string; details?: any[] } | null;
}
