import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "auth_token";
const USER_DATA_KEY = "user_data";

export const storage = {
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    } catch {
      // Fallback silently on unsupported platforms
    }
  },

  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    } catch {
      // Fallback silently
    }
  },

  async getUser<T = Record<string, unknown>>(): Promise<T | null> {
    try {
      const data = await SecureStore.getItemAsync(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setUser(user: Record<string, unknown>): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user));
    } catch {
      // Fallback silently
    }
  },

  async removeUser(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
    } catch {
      // Fallback silently
    }
  },

  async clear(): Promise<void> {
    await Promise.all([this.removeToken(), this.removeUser()]);
  },
};

export default storage;
