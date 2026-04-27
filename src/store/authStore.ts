import { create } from 'zustand';
import type { User, UserRole } from '@/types';
import { USERS } from '@/data/mockData';
import { sleep } from '@/lib/utils';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  verifyOTP: (otp: string) => Promise<boolean>;
  resetPassword: (password: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem('mytime-user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  isAuthenticated: !!localStorage.getItem('mytime-user'),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    await sleep(1200); // Simulate API call

    if (password !== 'password123') {
      set({ isLoading: false, error: 'Invalid email or password' });
      return false;
    }

    const user = USERS.find((u) => u.email === email);
    if (!user) {
      set({ isLoading: false, error: 'Invalid email or password' });
      return false;
    }

    localStorage.setItem('mytime-user', JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false, error: null });
    return true;
  },

  logout: () => {
    localStorage.removeItem('mytime-user');
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),

  forgotPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    await sleep(1000);
    const user = USERS.find((u) => u.email === email);
    if (!user) {
      set({ isLoading: false, error: 'No account found with this email' });
      return false;
    }
    set({ isLoading: false });
    return true;
  },

  verifyOTP: async (otp: string) => {
    set({ isLoading: true, error: null });
    await sleep(800);
    if (otp === '123456') {
      set({ isLoading: false });
      return true;
    }
    set({ isLoading: false, error: 'Invalid OTP. Try 123456.' });
    return false;
  },

  resetPassword: async (_password: string) => {
    set({ isLoading: true, error: null });
    await sleep(1000);
    set({ isLoading: false });
    return true;
  },
}));
