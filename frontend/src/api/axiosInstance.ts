import axios from 'axios';
import { storage } from '../utils/storage';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.104:5000/api';

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

// Response Interceptor — 401 = expired/invalid token -> clear sessio
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    if (status === 401) {
      await storage.clearAll();
    }
    // 403 = access denied (e.g. someone else's lead) — surface message, don't log out
    return Promise.reject(error);
  }
);

export default axiosInstance;