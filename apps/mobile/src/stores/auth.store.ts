import { create } from "zustand";
import { storage } from "@/lib/storage";
import api from "@/lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  hospital: string;
  avatar?: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });

      await storage.setToken(data.token);
      await storage.setUser(data.user);

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
      });
    } catch (error: any) {
      // For demo purposes, allow mock login
      if (email && password) {
        const mockUser: User = {
          id: "1",
          name: "Dr. Smith",
          email,
          role: "Senior Cardiologist",
          department: "Cardiology",
          hospital: "Apollo Hospitals, Delhi",
        };
        const mockToken = "mock-jwt-token";

        await storage.setToken(mockToken);
        await storage.setUser(mockUser);

        set({
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
        });
        return;
      }
      throw new Error(
        error?.response?.data?.message ?? "Invalid credentials"
      );
    }
  },

  logout: async () => {
    await storage.clear();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  loadSession: async () => {
    try {
      const token = await storage.getToken();
      const user = await storage.getUser<User>();

      if (token && user) {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
