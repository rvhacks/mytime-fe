import { create } from 'zustand';
import type { User, UserRole } from '@/types';
import { authAPI } from '@/services/api';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  verifyOTP: (email: string, otp: string) => Promise<boolean>;
  resetPassword: (email: string, otp: string, password: string) => Promise<boolean>;
  _fpEmail: string;
}

/** Map backend user row → frontend User shape */
function mapUser(u: any): User {
  return {
    id: u.id,
    email: u.email,
    name: `${u.first_name} ${u.last_name}`,
    role: u.role as UserRole,
    phone: u.mobile || '',
    designation: u.designation?.name || '',
    department: u.department || '',
    avatar: u.avatarUrl || '',
    joinDate: u.joining_date || '',
  };
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem('mytime_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  isAuthenticated: !!localStorage.getItem('mytime_token'),
  isLoading: false,
  error: null,
  _fpEmail: '',

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authAPI.login(email, password);
      const { token, refreshToken, user: rawUser } = res.data.data;
      const user = mapUser(rawUser);

      localStorage.setItem('mytime_token', token);
      localStorage.setItem('mytime_user', JSON.stringify(user));

      set({ user, isAuthenticated: true, isLoading: false, error: null });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('mytime_token');
    localStorage.removeItem('mytime_user');
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),

  forgotPassword: async (email: string) => {
    set({ isLoading: true, error: null, _fpEmail: email });
    try {
      await authAPI.forgotPassword(email);
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to send OTP' });
      return false;
    }
  },

  verifyOTP: async (email: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.verifyOtp(email, otp);
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Invalid OTP' });
      return false;
    }
  },

  resetPassword: async (email: string, otp: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.resetPassword(email, otp, password);
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Reset failed' });
      return false;
    }
  },
}));
