import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/endpoints';

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await authApi.login({ email, password });
    const { accessToken, user } = data.data;
    await AsyncStorage.setItem('accessToken', accessToken);
    set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
  },

  register: async (email, password, displayName) => {
    const { data } = await authApi.register({ email, password, displayName });
    const { accessToken, user } = data.data;
    await AsyncStorage.setItem('accessToken', accessToken);
    set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await AsyncStorage.removeItem('accessToken');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  restoreSession: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      try {
        const { data } = await authApi.getProfile();
        set({ user: data.data, token, isAuthenticated: true, isLoading: false });
      } catch (err: any) {
        // 网络错误或服务器错误时保留登录状态，不清除 token
        if (!err.response || err.response.status >= 500) {
          // 后端不可用或网络问题，保留 token，下次打开再恢复
          set({ token, isAuthenticated: true, isLoading: false });
        } else if (err.response?.status === 401) {
          // 只有明确的 401 才清除
          const code = err.response?.data?.error?.code;
          if (code === 'AUTH_TOKEN_EXPIRED' || code === 'AUTH_TOKEN_INVALID') {
            await AsyncStorage.removeItem('accessToken');
            set({ isLoading: false });
          } else {
            // 其他 401 情况保留 token
            set({ token, isAuthenticated: true, isLoading: false });
          }
        } else {
          // 其他错误保留登录状态
          set({ token, isAuthenticated: true, isLoading: false });
        }
      }
    } catch {
      // AsyncStorage 读取失败
      set({ isLoading: false });
    }
  },
}));
