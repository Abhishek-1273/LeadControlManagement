import { create } from 'zustand';
import { User, AuthState } from '../types/auth.types';
import { storage } from '../utils/storage';
import axiosInstance from '../api/axiosInstance';
import { isTokenExpired } from '../utils/jwt';

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
      await storage.setToken(token);
      await storage.setUser(user);
      set({ user, token, isAuthenticated: true, isLoading: false });
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

      // Restore only if token exists AND is not expired
      if (token && user && !isTokenExpired(token)) {
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        // Expired/invalid -> clean up so the user lands on login
        await storage.clearAll();
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));