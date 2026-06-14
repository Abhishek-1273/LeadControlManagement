import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';

export const storage = {
  // Token -> encrypted SecureStore
  setToken: async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  getToken: async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  removeToken: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  // Non-sensitive user profile -> AsyncStorage
  setUser: async (user: object) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser: async () => {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // Logout — clear only our keys, not all storage
  clearAll: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  },
};