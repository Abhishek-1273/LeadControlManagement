import { create } from 'zustand';
import { User, AuthState } from '../types/auth.types';
import { storage } from '../utils/storage';
import axiosInstance from '../api/axiosInstance';
import { isTokenExpired } from '../utils/jwt';
import { registerPushToken } from '../utils/registerPushToken';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post('/auth/login', {
        email: email.toLowerCase().trim(),
        password,
      });
      const { token, user } = response.data;
      console.log('LOGIN USER ROLE:', user?.role);
      await storage.setToken(token);
      await storage.setUser(user);
      set({ user, token, isAuthenticated: true, isLoading: false });

      // ← Push token register karo login ke baad
      try {
        const pushToken = await registerPushToken();
        if (pushToken) {
          await axiosInstance.post('/auth/push-token', { pushToken });
          console.log('✅ Push token registered');
        }
      } catch (pushErr) {
        // Push token fail hone se login affect na ho
        console.log('Push token registration failed:', pushErr);
      }

    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await storage.clearAll();
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),

  loadStoredAuth: async () => {
    try {
      const token = await storage.getToken();
      const user = await storage.getUser();

      if (token && user && !isTokenExpired(token)) {
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        await storage.clearAll();
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));