import { create } from 'zustand';
import type { Designation, Employee, ProjectAssignment } from '@/types';
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

  // Designations
  fetchDesignations: () => Promise<void>;
  addDesignation: (name: string) => Promise<void>;
  updateDesignation: (id: string, name: string) => Promise<void>;
  deleteDesignation: (id: string) => Promise<void>;

  // Employees
  fetchEmployees: () => Promise<void>;
  addEmployee: (data: Omit<Employee, 'id' | 'generatedPassword' | 'status' | 'createdAt'>) => Promise<Employee>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  resetEmployeePassword: (id: string) => Promise<string>;
  deleteEmployee: (id: string) => Promise<void>;

  // Assignments
  fetchAssignments: () => Promise<void>;
  addAssignment: (data: Omit<ProjectAssignment, 'id' | 'assignedAt'>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
}

function mapDesignation(d: any): Designation {
  const raw = d.created_at || d.createdAt || '';
  return { id: d.id, name: d.name, createdAt: typeof raw === 'string' ? raw.slice(0, 10) : '' };
}

function mapEmployee(u: any): Employee {
  return {
    id: u.id,
    firstName: u.first_name || u.firstName || '',
    lastName: u.last_name || u.lastName || '',
    email: u.email,
    mobile: u.mobile || '',
    dob: u.dob || '',
    designationId: u.designation_id || u.designationId || '',
    joiningDate: u.joining_date || u.joiningDate || '',
    generatedPassword: '',
    reportingManagerId: u.reporting_manager_id || u.reportingManagerId || '',
    status: u.status || 'active',
    createdAt: (u.created_at || u.createdAt || '').toString().slice(0, 10),
  };
}

function mapAssignment(a: any): ProjectAssignment {
  return {
    id: a.id,
    employeeId: a.user_id || a.employeeId,
    projectId: a.project_id || a.projectId,
    role: a.role,
    assignedAt: (a.created_at || a.createdAt || a.assignedAt || '').toString().slice(0, 10),
  };
}

export const useManagementStore = create<ManagementStore>((set) => ({
  designations: [],
  employees: [],
  assignments: [],
  isLoading: false,

  // ---- DESIGNATIONS ----
  fetchDesignations: async () => {
    set({ isLoading: true });
    try {
      const res = await designationAPI.getAll({ limit: 100 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({ designations: (Array.isArray(rows) ? rows : []).map(mapDesignation), isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  addDesignation: async (name) => {
    set({ isLoading: true });
    try {
      await designationAPI.create(name);
      const res = await designationAPI.getAll({ limit: 100 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({ designations: (Array.isArray(rows) ? rows : []).map(mapDesignation), isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  updateDesignation: async (id, name) => {
    set({ isLoading: true });
    try {
      await designationAPI.update(id, name);
      const res = await designationAPI.getAll({ limit: 100 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({ designations: (Array.isArray(rows) ? rows : []).map(mapDesignation), isLoading: false });
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
  fetchEmployees: async () => {
    set({ isLoading: true });
    try {
      const res = await employeeAPI.getAll({ limit: 100 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({ employees: (Array.isArray(rows) ? rows : []).map(mapEmployee), isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  addEmployee: async (data) => {
    set({ isLoading: true });
    try {
      const res = await employeeAPI.create(data);
      const pw = res.data.data.generatedPassword || generatePassword(data.firstName, data.mobile, data.dob);
      const newEmp = mapEmployee(res.data.data.user);
      newEmp.generatedPassword = pw;
      const listRes = await employeeAPI.getAll({ limit: 100 });
      const rows = listRes.data.data?.rows || listRes.data.data || [];
      set({ employees: (Array.isArray(rows) ? rows : []).map(mapEmployee), isLoading: false });
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
      const res = await employeeAPI.getAll({ limit: 100 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({ employees: (Array.isArray(rows) ? rows : []).map(mapEmployee), isLoading: false });
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

  deleteEmployee: async (id) => {
    set({ isLoading: true });
    try {
      await employeeAPI.delete(id);
      set((s) => ({ employees: s.employees.filter((e) => e.id !== id), isLoading: false }));
    } catch { set({ isLoading: false }); }
  },

  // ---- ASSIGNMENTS ----
  fetchAssignments: async () => {
    set({ isLoading: true });
    try {
      const res = await assignmentAPI.getAll({ limit: 100 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({ assignments: (Array.isArray(rows) ? rows : []).map(mapAssignment), isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  addAssignment: async (data) => {
    set({ isLoading: true });
    try {
      await assignmentAPI.create({ userId: data.employeeId, projectId: data.projectId, role: data.role });
      const res = await assignmentAPI.getAll({ limit: 100 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({ assignments: (Array.isArray(rows) ? rows : []).map(mapAssignment), isLoading: false });
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
