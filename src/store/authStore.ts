import { create } from 'zustand';
import type { User, UserRole } from '@/types';
import { authAPI } from '@/services/api';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  mustChangePassword: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  clearError: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  verifyOTP: (email: string, otp: string) => Promise<boolean>;
  resetPassword: (email: string, otp: string, password: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  _fpEmail: string;
}

/** Map backend user row → frontend User shape */
function mapUser(u: any): User {
  return {
    id: u.id,
    email: u.email,
    name: `${u.first_name} ${u.last_name}`,
    role: u.role as UserRole,
    isManager: !!u.isManager,
    phone: u.mobile || '',
    designation: u.designation?.name || '',
    dob: u.dob || '',
    avatar: u.avatarUrl || u.avatar_path || '',
    joinDate: u.joining_date || '',
    reportingManagerId: u.reporting_manager_id || '',
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
  mustChangePassword: (() => {
    try { return localStorage.getItem('mytime_must_change_pw') === 'true'; } catch { return false; }
  })(),
  _fpEmail: '',

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authAPI.login(email, password);
      const { token, refreshToken, user: rawUser } = res.data.data;
      const user = mapUser(rawUser);
      const mustChange = !!rawUser.mustChangePassword;

      localStorage.setItem('mytime_token', token);
      localStorage.setItem('mytime_user', JSON.stringify(user));
      if (mustChange) {
        localStorage.setItem('mytime_must_change_pw', 'true');
      } else {
        localStorage.removeItem('mytime_must_change_pw');
      }

      set({ user, isAuthenticated: true, isLoading: false, error: null, mustChangePassword: mustChange });
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
    localStorage.removeItem('mytime_must_change_pw');
    set({ user: null, isAuthenticated: false, error: null, mustChangePassword: false });
  },

  clearError: () => set({ error: null }),

  setUser: (user: User) => {
    localStorage.setItem('mytime_user', JSON.stringify(user));
    set({ user });
  },

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

  changePassword: async (currentPassword: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      localStorage.removeItem('mytime_must_change_pw');
      set({ isLoading: false, mustChangePassword: false });
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to change password' });
      return false;
    }
  },
}));
