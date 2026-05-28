import axios from 'axios';
import type { AxiosError } from 'axios';

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
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
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
  getMyReport: (params?: any) => api.get('/users/report', { params }),
  getMyTeam: (params?: { projectId?: string }) => api.get('/users/team', { params }),
};

// ---- ADMIN: DESIGNATIONS ----
export const designationAPI = {
  getAll: (params?: any) => api.get('/admin/designations', { params }),
  create: (name: string) => api.post('/admin/designations', { name }),
  update: (id: string, name: string) => api.put(`/admin/designations/${id}`, { name }),
  delete: (id: string) => api.delete(`/admin/designations/${id}`),
};

// ---- ADMIN: EMPLOYEES ----
export const employeeAPI = {
  getAll: (params?: any) => api.get('/admin/employees', { params }),
  create: (data: any) => api.post('/admin/employees', data),
  update: (id: string, data: any) => api.put(`/admin/employees/${id}`, data),
  resetPassword: (id: string) => api.post(`/admin/employees/${id}/reset-password`),
  deactivate: (id: string) => api.put(`/admin/employees/${id}/deactivate`),
  activate: (id: string) => api.put(`/admin/employees/${id}/activate`),
  delete: (id: string) => api.delete(`/admin/employees/${id}`),
};

// ---- ADMIN: PROJECTS ----
export const projectAPI = {
  getAll: (params?: any) => api.get('/admin/projects', { params }),
  create: (data: any) => api.post('/admin/projects', data),
  update: (id: string, data: any) => api.put(`/admin/projects/${id}`, data),
  delete: (id: string) => api.delete(`/admin/projects/${id}`),
};

// ---- ADMIN: ASSIGNMENTS ----
export const assignmentAPI = {
  getAll: (params?: any) => api.get('/admin/assignments', { params }),
  create: (data: any) => api.post('/admin/assignments', data),
  delete: (id: string) => api.delete(`/admin/assignments/${id}`),
};

// ---- ADMIN: MILESTONES ----
export const milestoneAPI = {
  getAll: (params?: any) => api.get('/admin/milestones', { params }),
  getByRole: (role: string) => api.get(`/admin/milestones/role/${role}`),
  create: (data: any) => api.post('/admin/milestones', data),
  update: (id: string, data: any) => api.put(`/admin/milestones/${id}`, data),
  delete: (id: string) => api.delete(`/admin/milestones/${id}`),
};

// ---- ADMIN: DASHBOARD ----
export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard/stats'),
  getActivity: () => api.get('/admin/dashboard/activity'),
  getRoleConstants: () => api.get('/admin/role-constants'),
};

// ---- ADMIN: APPROVAL MANAGER DASHBOARD ----
export const adminApprovalAPI = {
  getManagers: () => api.get('/admin/approvals/managers'),
  getManagerEntries: (managerId: string, params?: any) => api.get(`/admin/approvals/manager/${managerId}/entries`, { params }),
  sendReminders: (managerIds: string[]) => api.post('/admin/approvals/remind', { managerIds }),
};

// ---- TIMESHEETS ----
export const timesheetAPI = {
  getMyTimesheets: (params?: any) => api.get('/timesheets/my', { params }),
  getWeekTimesheet: (weekStartDate: string) =>
    api.get('/timesheets/week', { params: { weekStartDate } }),
  getAssignedProjects: () => api.get('/timesheets/assigned-projects'),
  getMilestonesByRole: (role: string) => api.get(`/timesheets/milestones/role/${role}`),
  save: (data: any) => api.post('/timesheets/save', data),
  // Entry-level submit/recall/delete
  submitEntries: (entryIds: string[]) => api.post('/timesheets/submit', { entryIds }),
  recallEntries: (entryIds: string[]) => api.post('/timesheets/recall', { entryIds }),
  deleteEntry: (entryId: string) => api.delete(`/timesheets/entry/${entryId}`),
  getDetail: (id: string) => api.get(`/timesheets/detail/${id}`),
  getRejectedEntries: () => api.get('/timesheets/rejected-entries'),
  getRejectionHistory: (entryId: string) => api.get(`/timesheets/rejection-history/${entryId}`),
  // Project detail (for employees)
  getProjectDetail: (projectId: string) => api.get(`/timesheets/project/${projectId}`),
  // Approvals (entry-level)
  getPendingApprovals: (params?: any) => api.get('/timesheets/approvals', { params }),
  approvalAction: (entryIds: string[], action: 'approve' | 'reject', comments?: string) =>
    api.post('/timesheets/approvals/action', { entryIds, action, comments }),
  // Admin: view employee timesheets
  getEmployeeTimesheets: (employeeId: string, params?: any) =>
    api.get(`/timesheets/employee/${employeeId}`, { params }),
  // Reports
  getReports: (filters: { startDate?: string; endDate?: string; userId?: string; projectId?: string }) =>
    api.get('/timesheets/reports', { params: filters }),
};

// ---- NOTIFICATIONS ----
export const notificationAPI = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
