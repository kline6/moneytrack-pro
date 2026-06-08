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
      const { data } = await authApi.getProfile();
      set({ user: data.data, token, isAuthenticated: true, isLoading: false });
    } catch {
      await AsyncStorage.removeItem('accessToken');
      set({ isLoading: false });
    }
  },
}));
