import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // SecureStore unavailable (e.g. web), skip
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("auth_token");
    }
    return Promise.reject(error);
  }
);

export default api;
