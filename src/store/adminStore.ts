import { create } from 'zustand';
import type { Project, ApprovalItem } from '@/types';
import { PROJECTS, APPROVAL_ITEMS } from '@/data/mockData';
import { generateId, sleep } from '@/lib/utils';

interface AdminStore {
  projects: Project[];
  approvals: ApprovalItem[];
  isLoading: boolean;

  addProject: (project: Omit<Project, 'id' | 'milestones'>) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addMilestone: (projectId: string, name: string) => void;

  approveTimesheet: (id: string) => Promise<void>;
  rejectTimesheet: (id: string, comments: string) => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set) => ({
  projects: PROJECTS,
  approvals: APPROVAL_ITEMS,
  isLoading: false,

  addProject: async (projectData) => {
    set({ isLoading: true });
    await sleep(600);
    const newProject: Project = {
      ...projectData,
      id: `p${generateId()}`,
      milestones: [],
    };
    set((state) => ({
      projects: [...state.projects, newProject],
      isLoading: false,
    }));
  },

  updateProject: async (id, data) => {
    set({ isLoading: true });
    await sleep(500);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
      isLoading: false,
    }));
  },

  deleteProject: async (id) => {
    set({ isLoading: true });
    await sleep(400);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      isLoading: false,
    }));
  },

  addMilestone: (projectId, name) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              milestones: [
                ...p.milestones,
                { id: `m${generateId()}`, name, projectId, status: 'pending' as const },
              ],
            }
          : p
      ),
    }));
  },

  approveTimesheet: async (id) => {
    set({ isLoading: true });
    await sleep(600);
    set((state) => ({
      approvals: state.approvals.map((a) =>
        a.id === id ? { ...a, status: 'approved' as const } : a
      ),
      isLoading: false,
    }));
  },

  rejectTimesheet: async (id, comments) => {
    set({ isLoading: true });
    await sleep(600);
    set((state) => ({
      approvals: state.approvals.map((a) =>
        a.id === id ? { ...a, status: 'rejected' as const } : a
      ),
      isLoading: false,
    }));
  },
}));
