import { create } from 'zustand';
import type { Project, ApprovalItem, TimesheetRow, DashboardStats } from '@/types';
import { projectAPI, timesheetAPI, dashboardAPI } from '@/services/api';

interface AdminStore {
  projects: Project[];
  approvals: ApprovalItem[];
  dashboardStats: DashboardStats | null;
  isLoading: boolean;

  fetchProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  fetchApprovals: () => Promise<void>;
  approveTimesheet: (id: string, comments?: string) => Promise<void>;
  rejectTimesheet: (id: string, comments: string) => Promise<void>;

  fetchDashboardStats: () => Promise<void>;
}

/** Map backend project → frontend Project shape */
function mapProject(p: any): Project {
  const assignments = p.assignments || [];
  return {
    id: p.id,
    name: p.name,
    code: p.project_code,
    color: p.color || '#6366f1',
    description: p.description || '',
    startDate: p.start_date || '',
    endDate: p.end_date || '',
    status: p.status,
    assignedEmployees: assignments.map((a: any) => a.user_id),
  };
}

/** Map backend timesheet → approval item */
function mapApproval(ts: any): ApprovalItem {
  const entries = ts.entries || [];
  const projectNames = [...new Set(entries.map((e: any) => e.project?.name).filter(Boolean))] as string[];
  const rows: TimesheetRow[] = entries.map((e: any) => ({
    id: e.id,
    projectId: e.project_id,
    milestoneId: e.milestone_id || '',
    taskDescription: e.task_description || '',
    billable: e.billable,
    hours: {
      mon: Number(e.hours_mon) || 0,
      tue: Number(e.hours_tue) || 0,
      wed: Number(e.hours_wed) || 0,
      thu: Number(e.hours_thu) || 0,
      fri: Number(e.hours_fri) || 0,
      sat: Number(e.hours_sat) || 0,
      sun: Number(e.hours_sun) || 0,
    },
  }));

  return {
    id: ts.id,
    userId: ts.user_id,
    userName: ts.user ? `${ts.user.first_name} ${ts.user.last_name}` : 'Unknown',
    userAvatar: '',
    weekStartDate: ts.week_start_date,
    weekEndDate: ts.week_end_date,
    totalHours: Number(ts.total_hours) || 0,
    status: ts.status === 'submitted' ? 'pending' : ts.status,
    submittedAt: ts.submitted_at || '',
    projects: projectNames,
    rows,
  };
}

export const useAdminStore = create<AdminStore>((set) => ({
  projects: [],
  approvals: [],
  dashboardStats: null,
  isLoading: false,

  fetchDashboardStats: async () => {
    try {
      const res = await dashboardAPI.getStats();
      set({ dashboardStats: res.data.data });
    } catch { /* silent */ }
  },

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const res = await projectAPI.getAll({ limit: 100 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({ projects: (Array.isArray(rows) ? rows : []).map(mapProject), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addProject: async (projectData) => {
    set({ isLoading: true });
    try {
      await projectAPI.create({
        projectCode: projectData.code,
        name: projectData.name,
        description: projectData.description,
        color: projectData.color,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        status: projectData.status,
      });
      const res = await projectAPI.getAll({ limit: 100 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({ projects: (Array.isArray(rows) ? rows : []).map(mapProject), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  updateProject: async (id, data) => {
    set({ isLoading: true });
    try {
      await projectAPI.update(id, {
        name: data.name,
        description: data.description,
        color: data.color,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
      });
      const res = await projectAPI.getAll({ limit: 100 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({ projects: (Array.isArray(rows) ? rows : []).map(mapProject), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  deleteProject: async (id) => {
    set({ isLoading: true });
    try {
      await projectAPI.delete(id);
      set((s) => ({ projects: s.projects.filter((p) => p.id !== id), isLoading: false }));
    } catch {
      set({ isLoading: false });
    }
  },

  fetchApprovals: async () => {
    set({ isLoading: true });
    try {
      const res = await timesheetAPI.getPendingApprovals();
      const rows = res.data.data?.rows || res.data.data || [];
      set({ approvals: (Array.isArray(rows) ? rows : []).map(mapApproval), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  approveTimesheet: async (id, comments) => {
    set({ isLoading: true });
    try {
      await timesheetAPI.approvalAction(id, 'approve', comments);
      set((s) => ({
        approvals: s.approvals.map((a) => (a.id === id ? { ...a, status: 'approved' as const } : a)),
        isLoading: false,
      }));
    } catch {
      set({ isLoading: false });
    }
  },

  rejectTimesheet: async (id, comments) => {
    set({ isLoading: true });
    try {
      await timesheetAPI.approvalAction(id, 'reject', comments);
      set((s) => ({
        approvals: s.approvals.map((a) => (a.id === id ? { ...a, status: 'rejected' as const } : a)),
        isLoading: false,
      }));
    } catch {
      set({ isLoading: false });
    }
  },
}));
