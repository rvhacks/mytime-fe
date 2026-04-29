import { create } from 'zustand';
import type { TimesheetWeek, TimesheetRow } from '@/types';
import { CURRENT_TIMESHEET, PAST_TIMESHEETS } from '@/data/mockData';
import { generateId, sleep } from '@/lib/utils';

interface TimesheetStore {
  currentTimesheet: TimesheetWeek;
  pastTimesheets: TimesheetWeek[];
  isLoading: boolean;
  isSaving: boolean;

  updateRowHours: (rowId: string, day: string, hours: number) => void;
  updateRowField: (rowId: string, field: keyof TimesheetRow, value: string | boolean) => void;
  addRow: () => void;
  removeRow: (rowId: string) => void;
  copyFromLastWeek: () => boolean;
  saveDraft: () => Promise<void>;
  submitTimesheet: () => Promise<void>;
  recalculateTotal: () => void;
}

export const useTimesheetStore = create<TimesheetStore>((set, get) => ({
  currentTimesheet: CURRENT_TIMESHEET,
  pastTimesheets: PAST_TIMESHEETS,
  isLoading: false,
  isSaving: false,

  updateRowHours: (rowId, day, hours) => {
    set((state) => {
      const rows = state.currentTimesheet.rows.map((r) =>
        r.id === rowId ? { ...r, hours: { ...r.hours, [day]: Math.max(0, Math.min(24, hours)) } } : r
      );
      const totalHours = rows.reduce(
        (sum, r) => sum + Object.values(r.hours).reduce((a, b) => a + b, 0),
        0
      );
      return {
        currentTimesheet: { ...state.currentTimesheet, rows, totalHours },
      };
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
      projectId: '',
      milestoneId: '',
      taskDescription: '',
      billable: true,
      hours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
    };
    set((state) => ({
      currentTimesheet: {
        ...state.currentTimesheet,
        rows: [...state.currentTimesheet.rows, newRow],
      },
    }));
  },

  removeRow: (rowId) => {
    set((state) => {
      const rows = state.currentTimesheet.rows.filter((r) => r.id !== rowId);
      const totalHours = rows.reduce(
        (sum, r) => sum + Object.values(r.hours).reduce((a, b) => a + b, 0),
        0
      );
      return {
        currentTimesheet: { ...state.currentTimesheet, rows, totalHours },
      };
    });
  },

  copyFromLastWeek: () => {
    const { pastTimesheets } = get();
    if (pastTimesheets.length === 0) return false;

    // Find the most recent past timesheet (sorted by weekStartDate desc)
    const sorted = [...pastTimesheets].sort(
      (a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime()
    );
    const lastWeek = sorted[0];

    // Copy rows with new IDs, keep project/milestone/task/billable, zero hours
    const copiedRows: TimesheetRow[] = lastWeek.rows.map((r) => ({
      id: generateId(),
      projectId: r.projectId,
      milestoneId: r.milestoneId,
      taskDescription: r.taskDescription,
      billable: r.billable,
      hours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
    }));

    set((state) => ({
      currentTimesheet: {
        ...state.currentTimesheet,
        rows: copiedRows,
        totalHours: 0,
      },
    }));
    return true;
  },

  saveDraft: async () => {
    set({ isSaving: true });
    await sleep(800);
    set({ isSaving: false });
  },

  submitTimesheet: async () => {
    set({ isSaving: true });
    await sleep(1200);
    set((state) => ({
      isSaving: false,
      currentTimesheet: {
        ...state.currentTimesheet,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      },
    }));
  },

  recalculateTotal: () => {
    set((state) => {
      const totalHours = state.currentTimesheet.rows.reduce(
        (sum, r) => sum + Object.values(r.hours).reduce((a, b) => a + b, 0),
        0
      );
      return {
        currentTimesheet: { ...state.currentTimesheet, totalHours },
      };
    });
  },
}));
