import { create } from 'zustand';
import type { Project, ApprovalEntry, DashboardStats, PaginationInfo, ManagerApprovalSummary } from '@/types';
import { projectAPI, timesheetAPI, dashboardAPI, adminApprovalAPI, milestoneAPI } from '@/services/api';

interface AdminStore {
  projects: Project[];
  approvals: ApprovalEntry[];
  dashboardStats: DashboardStats | null;
  isLoading: boolean;

  // Pagination
  projectPagination: PaginationInfo;
  milestonePagination: PaginationInfo;

  // Projects
  fetchProjects: (params?: any) => Promise<void>;
  addProject: (project: any) => Promise<void>;
  updateProject: (id: string, data: any) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Milestones
  milestones: any[];
  fetchMilestones: (params?: any) => Promise<void>;

  // Approvals
  fetchApprovals: () => Promise<void>;
  approveEntries: (entryIds: string[], comments?: string) => Promise<void>;
  rejectEntries: (entryIds: string[], comments: string) => Promise<void>;

  // Admin Approval Manager Dashboard
  managerApprovals: ManagerApprovalSummary[];
  fetchManagerApprovals: () => Promise<void>;
  sendReminders: (managerIds: string[]) => Promise<void>;

  fetchDashboardStats: () => Promise<void>;
}

const defaultPagination: PaginationInfo = { page: 1, limit: 10, total: 0, totalPages: 1 };

function extractPagination(res: any): PaginationInfo {
  const p = res.data?.data?.pagination;
  return p ? { page: p.page, limit: p.limit, total: p.total, totalPages: p.totalPages } : defaultPagination;
}

/** Map backend project → frontend Project shape */
function mapProject(p: any): Project {
  const assignments = p.assignments || [];
  return {
    id: p.id,
    projectId: p.project_id || '',
    name: p.name,
    code: p.project_code,
    color: p.color || '#6366f1',
    description: p.description || '',
    partnerProjectId: p.partner_project_id || '',
    startDate: p.start_date || '',
    endDate: p.end_date || '',
    status: p.status,
    assignedEmployees: assignments.map((a: any) => a.user_id),
  };
}

/** Map backend entry → approval entry */
function mapApprovalEntry(entry: any): ApprovalEntry {
  const ts = entry.timesheet || {};
  const user = ts.user || {};
  const project = entry.project || {};
  const milestone = entry.milestone || {};

  const hours: Record<string, number> = {
    mon: Number(entry.hours_mon) || 0,
    tue: Number(entry.hours_tue) || 0,
    wed: Number(entry.hours_wed) || 0,
    thu: Number(entry.hours_thu) || 0,
    fri: Number(entry.hours_fri) || 0,
    sat: Number(entry.hours_sat) || 0,
    sun: Number(entry.hours_sun) || 0,
  };
  const totalHours = Object.values(hours).reduce((a, b) => a + b, 0);

  return {
    id: entry.id,
    timesheetId: entry.timesheet_id || ts.id || '',
    userId: ts.user_id || user.id || '',
    userName: user.first_name ? `${user.first_name} ${user.last_name}` : 'Unknown',
    weekStartDate: ts.week_start_date || '',
    weekEndDate: ts.week_end_date || '',
    projectId: entry.project_id || project.id || '',
    projectName: project.name || '',
    projectCode: project.project_code || '',
    projectColor: project.color || '#6366f1',
    milestoneName: milestone.name || '—',
    taskDescription: entry.task_description || '',
    billable: entry.billable !== false,
    hours,
    totalHours,
    status: entry.status || 'submitted',
    submittedAt: entry.submitted_at || '',
  };
}

export const useAdminStore = create<AdminStore>((set) => ({
  projects: [],
  approvals: [],
  milestones: [],
  dashboardStats: null,
  isLoading: false,
  projectPagination: defaultPagination,
  milestonePagination: defaultPagination,
  managerApprovals: [],

  fetchDashboardStats: async () => {
    try {
      const res = await dashboardAPI.getStats();
      set({ dashboardStats: res.data.data });
    } catch { /* silent */ }
  },

  fetchProjects: async (params?: any) => {
    set({ isLoading: true });
    try {
      const res = await projectAPI.getAll(params || { limit: 10 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({
        projects: (Array.isArray(rows) ? rows : []).map(mapProject),
        projectPagination: extractPagination(res),
        isLoading: false,
      });
    } catch { set({ isLoading: false }); }
  },

  addProject: async (projectData) => {
    set({ isLoading: true });
    try {
      await projectAPI.create({
        projectCode: projectData.code,
        name: projectData.name,
        description: projectData.description,
        color: projectData.color,
        partnerProjectId: projectData.partnerProjectId,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        status: projectData.status,
      });
      const res = await projectAPI.getAll({ limit: 10 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({
        projects: (Array.isArray(rows) ? rows : []).map(mapProject),
        projectPagination: extractPagination(res),
        isLoading: false,
      });
    } catch { set({ isLoading: false }); }
  },

  updateProject: async (id, data) => {
    set({ isLoading: true });
    try {
      await projectAPI.update(id, {
        name: data.name,
        description: data.description,
        color: data.color,
        partnerProjectId: data.partnerProjectId,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
      });
      const res = await projectAPI.getAll({ limit: 10 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({
        projects: (Array.isArray(rows) ? rows : []).map(mapProject),
        projectPagination: extractPagination(res),
        isLoading: false,
      });
    } catch { set({ isLoading: false }); }
  },

  deleteProject: async (id) => {
    set({ isLoading: true });
    try {
      await projectAPI.delete(id);
      set((s) => ({ projects: s.projects.filter((p) => p.id !== id), isLoading: false }));
    } catch { set({ isLoading: false }); }
  },

  // ---- MILESTONES ----
  fetchMilestones: async (params?: any) => {
    set({ isLoading: true });
    try {
      const res = await milestoneAPI.getAll(params || { limit: 10 });
      const rows = res.data.data?.rows || res.data.data || [];
      set({
        milestones: Array.isArray(rows) ? rows : [],
        milestonePagination: extractPagination(res),
        isLoading: false,
      });
    } catch { set({ isLoading: false }); }
  },

  // ---- APPROVALS (manager view - unchanged) ----
  fetchApprovals: async () => {
    set({ isLoading: true });
    try {
      const res = await timesheetAPI.getPendingApprovals();
      const rows = res.data.data?.rows || res.data.data || [];
      set({ approvals: (Array.isArray(rows) ? rows : []).map(mapApprovalEntry), isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  approveEntries: async (entryIds, comments) => {
    set({ isLoading: true });
    try {
      await timesheetAPI.approvalAction(entryIds, 'approve', comments);
      set((s) => ({ approvals: s.approvals.filter((a) => !entryIds.includes(a.id)), isLoading: false }));
    } catch { set({ isLoading: false }); }
  },

  rejectEntries: async (entryIds, comments) => {
    set({ isLoading: true });
    try {
      await timesheetAPI.approvalAction(entryIds, 'reject', comments);
      set((s) => ({ approvals: s.approvals.filter((a) => !entryIds.includes(a.id)), isLoading: false }));
    } catch { set({ isLoading: false }); }
  },

  // ---- ADMIN: Manager Approval Dashboard ----
  fetchManagerApprovals: async () => {
    set({ isLoading: true });
    try {
      const res = await adminApprovalAPI.getManagers();
      set({ managerApprovals: res.data.data || [], isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  sendReminders: async (managerIds) => {
    set({ isLoading: true });
    try {
      await adminApprovalAPI.sendReminders(managerIds);
      set({ isLoading: false });
    } catch { set({ isLoading: false }); }
  },
}));
