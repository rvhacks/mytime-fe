import { create } from 'zustand';
import type { Designation, Employee, ProjectAssignment, PaginationInfo } from '@/types';
import { designationAPI, employeeAPI, assignmentAPI } from '@/services/api';

// ========================================
// Password generator: FIRST4(CAPS) + LAST4(mobile) + DDMM(dob)
// ========================================
export function generatePassword(firstName: string, mobile: string, dob: string): string {
  const namePart = firstName.toUpperCase().slice(0, 4).padEnd(4, 'X');
  const mobilePart = mobile.slice(-4);
  const d = new Date(dob);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${namePart}${mobilePart}${dd}${mm}`;
}

interface ManagementStore {
  designations: Designation[];
  employees: Employee[];
  assignments: ProjectAssignment[];
  isLoading: boolean;

  // Pagination state per entity
  designationPagination: PaginationInfo;
  employeePagination: PaginationInfo;
  assignmentPagination: PaginationInfo;

  // Designations
  fetchDesignations: (params?: any) => Promise<void>;
  addDesignation: (name: string) => Promise<void>;
  updateDesignation: (id: string, name: string) => Promise<void>;
  deleteDesignation: (id: string) => Promise<void>;

  // Employees
  fetchEmployees: (params?: any) => Promise<void>;
  addEmployee: (data: any) => Promise<Employee>;
  updateEmployee: (id: string, data: any) => Promise<void>;
  resetEmployeePassword: (id: string) => Promise<string>;
  deactivateEmployee: (id: string) => Promise<void>;
  activateEmployee: (id: string) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  // Assignments
  fetchAssignments: (params?: any) => Promise<void>;
  addAssignment: (data: Omit<ProjectAssignment, 'id' | 'assignedAt'>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
}

const defaultPagination: PaginationInfo = { page: 1, limit: 10, total: 0, totalPages: 1 };

function mapDesignation(d: any): Designation {
  const raw = d.created_at || d.createdAt || '';
  return { id: d.id, name: d.name, createdAt: typeof raw === 'string' ? raw.slice(0, 10) : '' };
}

function mapEmployee(u: any): Employee {
  const rm = u.reportingManager || u.reporting_manager;
  return {
    id: u.id,
    employeeId: u.employee_id || u.employeeId || '',
    firstName: u.first_name || u.firstName || '',
    lastName: u.last_name || u.lastName || '',
    email: u.email,
    mobile: u.mobile || '',
    dob: u.dob || '',
    designationId: u.designation_id || u.designationId || '',
    joiningDate: u.joining_date || u.joiningDate || '',
    generatedPassword: '',
    reportingManagerId: u.reporting_manager_id || u.reportingManagerId || '',
    reportingManagerName: rm ? `${rm.first_name || rm.firstName || ''} ${rm.last_name || rm.lastName || ''}`.trim() : '',
    avatar_path: u.avatar_path || '',
    status: u.status || 'active',
    createdAt: (u.created_at || u.createdAt || '').toString().slice(0, 10),
  };
}

function mapAssignment(a: any): ProjectAssignment {
  const user = a.user || {};
  const project = a.project || {};
  return {
    id: a.id,
    employeeId: a.user_id || a.employeeId,
    projectId: a.project_id || a.projectId,
    role: a.role,
    assignedAt: (a.created_at || a.createdAt || a.assignedAt || '').toString().slice(0, 10),
    projectName: project.name || '',
    employeeName: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '',
  };
}

function extractPagination(res: any): PaginationInfo {
  const p = res.data?.data?.pagination;
  return p ? { page: p.page, limit: p.limit, total: p.total, totalPages: p.totalPages } : defaultPagination;
}

export const useManagementStore = create<ManagementStore>((set) => ({
  designations: [],
  employees: [],
  assignments: [],
  isLoading: false,
  designationPagination: defaultPagination,
  employeePagination: defaultPagination,
  assignmentPagination: defaultPagination,

  // ---- DESIGNATIONS ----
  fetchDesignations: async (params?: any) => {
    set({ isLoading: true });
    try {
      const res = await designationAPI.getAll(params || { limit: 10 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({
        designations: (Array.isArray(rows) ? rows : []).map(mapDesignation),
        designationPagination: extractPagination(res),
        isLoading: false,
      });
    } catch { set({ isLoading: false }); }
  },

  addDesignation: async (name) => {
    set({ isLoading: true });
    try {
      await designationAPI.create(name);
      const res = await designationAPI.getAll({ limit: 10 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({
        designations: (Array.isArray(rows) ? rows : []).map(mapDesignation),
        designationPagination: extractPagination(res),
        isLoading: false,
      });
    } catch { set({ isLoading: false }); }
  },

  updateDesignation: async (id, name) => {
    set({ isLoading: true });
    try {
      await designationAPI.update(id, name);
      const res = await designationAPI.getAll({ limit: 10 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({
        designations: (Array.isArray(rows) ? rows : []).map(mapDesignation),
        designationPagination: extractPagination(res),
        isLoading: false,
      });
    } catch { set({ isLoading: false }); }
  },

  deleteDesignation: async (id) => {
    set({ isLoading: true });
    try {
      await designationAPI.delete(id);
      set((s) => ({ designations: s.designations.filter((d) => d.id !== id), isLoading: false }));
    } catch { set({ isLoading: false }); }
  },

  // ---- EMPLOYEES ----
  fetchEmployees: async (params?: any) => {
    set({ isLoading: true });
    try {
      const res = await employeeAPI.getAll(params || { limit: 10 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({
        employees: (Array.isArray(rows) ? rows : []).map(mapEmployee),
        employeePagination: extractPagination(res),
        isLoading: false,
      });
    } catch { set({ isLoading: false }); }
  },

  addEmployee: async (data) => {
    set({ isLoading: true });
    try {
      const res = await employeeAPI.create(data);
      const pw = res.data.data.generatedPassword || generatePassword(data.firstName, data.mobile, data.dob);
      const newEmp = mapEmployee(res.data.data.user);
      newEmp.generatedPassword = pw;
      const listRes = await employeeAPI.getAll({ limit: 10 });
      const rows = listRes.data.data?.rows || listRes.data.data || [];
      set({
        employees: (Array.isArray(rows) ? rows : []).map(mapEmployee),
        employeePagination: extractPagination(listRes),
        isLoading: false,
      });
      return newEmp;
    } catch {
      set({ isLoading: false });
      throw new Error('Failed to create employee');
    }
  },

  updateEmployee: async (id, data) => {
    set({ isLoading: true });
    try {
      await employeeAPI.update(id, data);
      const res = await employeeAPI.getAll({ limit: 10 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({
        employees: (Array.isArray(rows) ? rows : []).map(mapEmployee),
        employeePagination: extractPagination(res),
        isLoading: false,
      });
    } catch { set({ isLoading: false }); }
  },

  resetEmployeePassword: async (id) => {
    try {
      const res = await employeeAPI.resetPassword(id);
      return res.data.data.generatedPassword;
    } catch {
      throw new Error('Failed to reset password');
    }
  },

  deactivateEmployee: async (id) => {
    set({ isLoading: true });
    try {
      await employeeAPI.deactivate(id);
      set((s) => ({
        employees: s.employees.map((e) => e.id === id ? { ...e, status: 'inactive' as const } : e),
        isLoading: false,
      }));
    } catch { set({ isLoading: false }); }
  },

  activateEmployee: async (id) => {
    set({ isLoading: true });
    try {
      await employeeAPI.activate(id);
      set((s) => ({
        employees: s.employees.map((e) => e.id === id ? { ...e, status: 'active' as const } : e),
        isLoading: false,
      }));
    } catch { set({ isLoading: false }); }
  },

  deleteEmployee: async (id) => {
    set({ isLoading: true });
    try {
      await employeeAPI.delete(id);
      set((s) => ({ employees: s.employees.filter((e) => e.id !== id), isLoading: false }));
    } catch { set({ isLoading: false }); }
  },

  // ---- ASSIGNMENTS ----
  fetchAssignments: async (params?: any) => {
    set({ isLoading: true });
    try {
      const res = await assignmentAPI.getAll(params || { limit: 10 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({
        assignments: (Array.isArray(rows) ? rows : []).map(mapAssignment),
        assignmentPagination: extractPagination(res),
        isLoading: false,
      });
    } catch { set({ isLoading: false }); }
  },

  addAssignment: async (data) => {
    set({ isLoading: true });
    try {
      await assignmentAPI.create({ userId: data.employeeId, projectId: data.projectId, role: data.role });
      const res = await assignmentAPI.getAll({ limit: 10 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({
        assignments: (Array.isArray(rows) ? rows : []).map(mapAssignment),
        assignmentPagination: extractPagination(res),
        isLoading: false,
      });
    } catch { set({ isLoading: false }); }
  },

  deleteAssignment: async (id) => {
    set({ isLoading: true });
    try {
      await assignmentAPI.delete(id);
      set((s) => ({ assignments: s.assignments.filter((a) => a.id !== id), isLoading: false }));
    } catch { set({ isLoading: false }); }
  },
}));
