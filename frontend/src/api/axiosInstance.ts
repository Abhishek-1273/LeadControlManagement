import axios from 'axios';
import { storage } from '../utils/storage';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || '';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor — attach token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor — 401 = expired/invalid token -> clear session
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    if (status === 401) {
      await storage.clearAll();
      // FIX: clearing storage alone left useAuthStore's in-memory state
      // (isAuthenticated/user/token) stale, so AppNavigator kept rendering
      // protected screens after a mid-session 401 (expired/invalid token)
      // with no way back to the login screen short of force-closing the
      // app. Required lazily here (not imported at module top) to avoid a
      // circular import, since authStore.ts itself imports axiosInstance.
      const { useAuthStore } = require('../store/authStore');
      useAuthStore.setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
    // 403 = access denied (e.g. someone else's lead) — surface message, don't log out
    return Promise.reject(error);
  }
);

export default axiosInstance;