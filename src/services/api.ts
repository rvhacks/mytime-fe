import axios from 'axios';
import type { AxiosRequestConfig, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Request interceptor: attach JWT ----
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mytime_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response interceptor: handle 401 ----
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mytime_token');
      localStorage.removeItem('mytime_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---- AUTH ----
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  verifyOtp: (email: string, otp: string) =>
    api.post('/auth/verify-otp', { email, otp }),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, otp, newPassword }),
  getMe: () => api.get('/auth/me'),
};

// ---- USER ----
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/users/change-password', { currentPassword, newPassword }),
};

// ---- ADMIN: DESIGNATIONS ----
export const designationAPI = {
  getAll: () => api.get('/admin/designations'),
  create: (name: string) => api.post('/admin/designations', { name }),
  update: (id: string, name: string) => api.put(`/admin/designations/${id}`, { name }),
  delete: (id: string) => api.delete(`/admin/designations/${id}`),
};

// ---- ADMIN: EMPLOYEES ----
export const employeeAPI = {
  getAll: () => api.get('/admin/employees'),
  create: (data: any) => api.post('/admin/employees', data),
  update: (id: string, data: any) => api.put(`/admin/employees/${id}`, data),
  delete: (id: string) => api.delete(`/admin/employees/${id}`),
};

// ---- ADMIN: PROJECTS ----
export const projectAPI = {
  getAll: () => api.get('/admin/projects'),
  create: (data: any) => api.post('/admin/projects', data),
  update: (id: string, data: any) => api.put(`/admin/projects/${id}`, data),
  delete: (id: string) => api.delete(`/admin/projects/${id}`),
};

// ---- ADMIN: ASSIGNMENTS ----
export const assignmentAPI = {
  getAll: () => api.get('/admin/assignments'),
  create: (data: any) => api.post('/admin/assignments', data),
  delete: (id: string) => api.delete(`/admin/assignments/${id}`),
};

// ---- ADMIN: MILESTONES ----
export const milestoneAPI = {
  getAll: () => api.get('/admin/milestones'),
  create: (data: any) => api.post('/admin/milestones', data),
  update: (id: string, data: any) => api.put(`/admin/milestones/${id}`, data),
  delete: (id: string) => api.delete(`/admin/milestones/${id}`),
};

// ---- TIMESHEETS ----
export const timesheetAPI = {
  getMyTimesheets: () => api.get('/timesheets/my'),
  getWeekTimesheet: (weekStartDate: string) =>
    api.get('/timesheets/week', { params: { weekStartDate } }),
  save: (data: any) => api.post('/timesheets/save', data),
  submit: (timesheetId: string) => api.post('/timesheets/submit', { timesheetId }),
  recall: (id: string) => api.post(`/timesheets/recall/${id}`),
  getDetail: (id: string) => api.get(`/timesheets/detail/${id}`),
  // Approvals
  getPendingApprovals: () => api.get('/timesheets/approvals'),
  approvalAction: (timesheetId: string, action: 'approve' | 'reject', comments?: string) =>
    api.post('/timesheets/approvals/action', { timesheetId, action, comments }),
  // Reports
  getReports: (filters: { startDate?: string; endDate?: string; userId?: string; projectId?: string }) =>
    api.get('/timesheets/reports', { params: filters }),
};

export default api;
