import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';

const isWeb = Platform.OS === 'web';

export const storage = {
  setToken: async (token: string) => {
    if (isWeb) {
      localStorage.setItem(TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  getToken: async (): Promise<string | null> => {
    if (isWeb) return localStorage.getItem(TOKEN_KEY);
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  removeToken: async () => {
    if (isWeb) { localStorage.removeItem(TOKEN_KEY); return; }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  setUser: async (user: object) => {
    if (isWeb) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return;
    }
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser: async () => {
    if (isWeb) {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    }
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  clearAll: async () => {
    if (isWeb) { localStorage.clear(); return; }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  },
};