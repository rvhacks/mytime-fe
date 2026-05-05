import { create } from 'zustand';
import type { Designation, Employee, ProjectAssignment, Project, Milestone, ProjectRole } from '@/types';
import { DESIGNATIONS, EMPLOYEES, PROJECT_ASSIGNMENTS } from '@/data/mockData';
import { generateId, sleep } from '@/lib/utils';

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
  addDesignation: (name: string) => Promise<void>;
  updateDesignation: (id: string, name: string) => Promise<void>;
  deleteDesignation: (id: string) => Promise<void>;

  // Employees
  addEmployee: (data: Omit<Employee, 'id' | 'generatedPassword' | 'status' | 'createdAt'>) => Promise<Employee>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  // Assignments
  addAssignment: (data: Omit<ProjectAssignment, 'id' | 'assignedAt'>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
}

export const useManagementStore = create<ManagementStore>((set, get) => ({
  designations: DESIGNATIONS,
  employees: EMPLOYEES,
  assignments: PROJECT_ASSIGNMENTS,
  isLoading: false,

  // ---- DESIGNATIONS ----
  addDesignation: async (name) => {
    set({ isLoading: true });
    await sleep(400);
    const newDes: Designation = {
      id: `des${generateId()}`,
      name,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    set((s) => ({ designations: [...s.designations, newDes], isLoading: false }));
  },

  updateDesignation: async (id, name) => {
    set({ isLoading: true });
    await sleep(300);
    set((s) => ({
      designations: s.designations.map((d) => (d.id === id ? { ...d, name } : d)),
      isLoading: false,
    }));
  },

  deleteDesignation: async (id) => {
    set({ isLoading: true });
    await sleep(300);
    set((s) => ({
      designations: s.designations.filter((d) => d.id !== id),
      isLoading: false,
    }));
  },

  // ---- EMPLOYEES ----
  addEmployee: async (data) => {
    set({ isLoading: true });
    await sleep(500);
    const pw = generatePassword(data.firstName, data.mobile, data.dob);
    const newEmp: Employee = {
      ...data,
      id: `emp${generateId()}`,
      generatedPassword: pw,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    set((s) => ({
      employees: [...s.employees, newEmp],
      isLoading: false,
    }));
    return newEmp;
  },

  updateEmployee: async (id, data) => {
    set({ isLoading: true });
    await sleep(400);
    set((s) => ({
      employees: s.employees.map((e) => (e.id === id ? { ...e, ...data } : e)),
      isLoading: false,
    }));
  },

  deleteEmployee: async (id) => {
    set({ isLoading: true });
    await sleep(300);
    set((s) => ({
      employees: s.employees.filter((e) => e.id !== id),
      isLoading: false,
    }));
  },

  // ---- ASSIGNMENTS ----
  addAssignment: async (data) => {
    set({ isLoading: true });
    await sleep(400);
    const newAssignment: ProjectAssignment = {
      ...data,
      id: `pa${generateId()}`,
      assignedAt: new Date().toISOString().slice(0, 10),
    };
    set((s) => ({
      assignments: [...s.assignments, newAssignment],
      isLoading: false,
    }));
  },

  deleteAssignment: async (id) => {
    set({ isLoading: true });
    await sleep(300);
    set((s) => ({
      assignments: s.assignments.filter((a) => a.id !== id),
      isLoading: false,
    }));
  },
}));
