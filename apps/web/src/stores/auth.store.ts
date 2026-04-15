import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'doctor' | 'student' | 'patient' | 'admin' | 'hms_staff';
  avatar?: string;
  specialization?: string;
  hospital?: string;
  phone?: string;
  nmcRegistration?: string;
  onboarded?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  completeOnboarding: (details: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem('auth-token', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('auth-token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user }),

      completeOnboarding: (details) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...details, onboarded: true } });
      },
    }),
    {
      name: 'caseconnect-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
