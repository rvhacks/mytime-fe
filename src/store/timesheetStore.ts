import { create } from 'zustand';
import type { TimesheetWeek, TimesheetRow } from '@/types';
import { timesheetAPI } from '@/services/api';
import { generateId } from '@/lib/utils';

interface TimesheetStore {
  currentTimesheet: TimesheetWeek;
  pastTimesheets: TimesheetWeek[];
  isLoading: boolean;
  isSaving: boolean;

  fetchTimesheets: () => Promise<void>;
  loadWeek: (weekStartDate: string, weekEndDate: string) => Promise<void>;
  updateRowHours: (rowId: string, day: string, hours: number) => void;
  updateRowField: (rowId: string, field: keyof TimesheetRow, value: string | boolean) => void;
  addRow: () => void;
  removeRow: (rowId: string) => void;
  copyFromLastWeek: () => boolean;
  saveDraft: () => Promise<void>;
  submitTimesheet: () => Promise<void>;
  recallTimesheet: (id: string) => Promise<void>;
  recalculateTotal: () => void;
}

function mapTimesheetRow(e: any): TimesheetRow {
  return {
    id: e.id,
    projectId: e.project_id || e.project?.id || '',
    milestoneId: e.milestone_id || '',
    taskDescription: e.task_description || '',
    billable: e.billable !== false,
    hours: {
      mon: Number(e.hours_mon) || 0,
      tue: Number(e.hours_tue) || 0,
      wed: Number(e.hours_wed) || 0,
      thu: Number(e.hours_thu) || 0,
      fri: Number(e.hours_fri) || 0,
      sat: Number(e.hours_sat) || 0,
      sun: Number(e.hours_sun) || 0,
    },
  };
}

function mapTimesheet(ts: any): TimesheetWeek {
  const rows = (ts.entries || []).map(mapTimesheetRow);
  return {
    id: ts.id,
    userId: ts.user_id,
    weekStartDate: ts.week_start_date,
    weekEndDate: ts.week_end_date,
    status: ts.status,
    submittedAt: ts.submitted_at || undefined,
    reviewedAt: ts.reviewed_at || undefined,
    reviewedBy: ts.reviewed_by || undefined,
    comments: ts.comments || undefined,
    totalHours: Number(ts.total_hours) || 0,
    rows,
  };
}

function emptyTimesheet(): TimesheetWeek {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  return {
    id: '',
    userId: '',
    weekStartDate: fmt(monday),
    weekEndDate: fmt(sunday),
    status: 'draft',
    totalHours: 0,
    rows: [
      { id: generateId(), projectId: '', milestoneId: '', taskDescription: '', billable: true, hours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 } },
    ],
  };
}

export const useTimesheetStore = create<TimesheetStore>((set, get) => ({
  currentTimesheet: emptyTimesheet(),
  pastTimesheets: [],
  isLoading: false,
  isSaving: false,

  fetchTimesheets: async () => {
    set({ isLoading: true });
    try {
      const res = await timesheetAPI.getMyTimesheets();
      const data = res.data.data;
      const rows = data.rows || data;
      const all = (Array.isArray(rows) ? rows : []).map(mapTimesheet);

      // Current week = most recent draft or the one matching this week
      const today = new Date();
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
      const thisWeekStart = monday.toISOString().slice(0, 10);

      let current = all.find((t) => t.weekStartDate === thisWeekStart);
      const past = all.filter((t) => t.weekStartDate !== thisWeekStart);

      if (!current) current = emptyTimesheet();

      set({ currentTimesheet: current, pastTimesheets: past, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadWeek: async (weekStartDate, weekEndDate) => {
    set({ isLoading: true });
    try {
      const res = await timesheetAPI.getWeekTimesheet(weekStartDate);
      const ts = res.data.data;
      if (ts) {
        set({ currentTimesheet: mapTimesheet(ts), isLoading: false });
      } else {
        set({
          currentTimesheet: {
            id: '', userId: '', weekStartDate, weekEndDate, status: 'draft', totalHours: 0,
            rows: [{ id: generateId(), projectId: '', milestoneId: '', taskDescription: '', billable: true, hours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 } }],
          },
          isLoading: false,
        });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  updateRowHours: (rowId, day, hours) => {
    set((state) => {
      const rows = state.currentTimesheet.rows.map((r) =>
        r.id === rowId ? { ...r, hours: { ...r.hours, [day]: Math.max(0, Math.min(24, hours)) } } : r
      );
      const totalHours = rows.reduce(
        (sum, r) => sum + Object.values(r.hours).reduce((a, b) => a + b, 0), 0
      );
      return { currentTimesheet: { ...state.currentTimesheet, rows, totalHours } };
    });
  },

  updateRowField: (rowId, field, value) => {
    set((state) => ({
      currentTimesheet: {
        ...state.currentTimesheet,
        rows: state.currentTimesheet.rows.map((r) =>
          r.id === rowId ? { ...r, [field]: value } : r
        ),
      },
    }));
  },

  addRow: () => {
    const newRow: TimesheetRow = {
      id: generateId(),
      projectId: '', milestoneId: '', taskDescription: '', billable: true,
      hours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
    };
    set((state) => ({
      currentTimesheet: { ...state.currentTimesheet, rows: [...state.currentTimesheet.rows, newRow] },
    }));
  },

  removeRow: (rowId) => {
    set((state) => {
      const rows = state.currentTimesheet.rows.filter((r) => r.id !== rowId);
      const totalHours = rows.reduce(
        (sum, r) => sum + Object.values(r.hours).reduce((a, b) => a + b, 0), 0
      );
      return { currentTimesheet: { ...state.currentTimesheet, rows, totalHours } };
    });
  },

  copyFromLastWeek: () => {
    const { pastTimesheets } = get();
    if (pastTimesheets.length === 0) return false;
    const sorted = [...pastTimesheets].sort(
      (a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime()
    );
    const lastWeek = sorted[0];
    const copiedRows: TimesheetRow[] = lastWeek.rows.map((r) => ({
      id: generateId(), projectId: r.projectId, milestoneId: r.milestoneId,
      taskDescription: r.taskDescription, billable: r.billable,
      hours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
    }));
    set((state) => ({
      currentTimesheet: { ...state.currentTimesheet, rows: copiedRows, totalHours: 0 },
    }));
    return true;
  },

  saveDraft: async () => {
    set({ isSaving: true });
    try {
      const ts = get().currentTimesheet;
      const entries = ts.rows.filter((r) => r.projectId).map((r) => ({
        projectId: r.projectId,
        milestoneId: r.milestoneId || null,
        taskDescription: r.taskDescription,
        billable: r.billable,
        hours: r.hours,
      }));
      if (entries.length === 0) { set({ isSaving: false }); return; }

      const res = await timesheetAPI.save({
        weekStartDate: ts.weekStartDate,
        weekEndDate: ts.weekEndDate,
        entries,
      });
      set({ currentTimesheet: mapTimesheet(res.data.data), isSaving: false });
    } catch {
      set({ isSaving: false });
    }
  },

  submitTimesheet: async () => {
    set({ isSaving: true });
    try {
      // Save first if needed
      const ts = get().currentTimesheet;
      if (!ts.id) await get().saveDraft();

      const updatedTs = get().currentTimesheet;
      if (!updatedTs.id) { set({ isSaving: false }); return; }

      const res = await timesheetAPI.submit(updatedTs.id);
      set({ currentTimesheet: mapTimesheet(res.data.data), isSaving: false });
    } catch {
      set({ isSaving: false });
    }
  },

  recallTimesheet: async (id) => {
    set({ isSaving: true });
    try {
      const res = await timesheetAPI.recall(id);
      set({ currentTimesheet: mapTimesheet(res.data.data), isSaving: false });
    } catch {
      set({ isSaving: false });
    }
  },

  recalculateTotal: () => {
    set((state) => {
      const totalHours = state.currentTimesheet.rows.reduce(
        (sum, r) => sum + Object.values(r.hours).reduce((a, b) => a + b, 0), 0
      );
      return { currentTimesheet: { ...state.currentTimesheet, totalHours } };
    });
  },
}));
