import { create } from 'zustand';
import type { TimesheetWeek, TimesheetRow, EntryStatus } from '@/types';
import { timesheetAPI } from '@/services/api';
import { generateId } from '@/lib/utils';

interface TimesheetStore {
  currentTimesheet: TimesheetWeek;
  pastTimesheets: TimesheetWeek[];
  isLoading: boolean;
  isSaving: boolean;
  _lastSavedHash: string;

  fetchTimesheets: () => Promise<void>;
  loadWeek: (weekStartDate: string, weekEndDate: string) => Promise<void>;
  updateRowHours: (rowId: string, day: string, hours: number) => void;
  updateRowField: (rowId: string, field: keyof TimesheetRow, value: string | boolean) => void;
  addRow: () => void;
  removeRow: (rowId: string) => Promise<void>;
  copyFromLastWeek: () => Promise<boolean>;
  saveDraft: () => Promise<void>;
  submitEntries: (entryIds: string[]) => Promise<void>;
  recallEntries: (entryIds: string[]) => Promise<void>;
  recalculateTotal: () => void;
}

function mapTimesheetRow(e: any): TimesheetRow {
  return {
    id: e.id,
    projectId: e.project_id || e.project?.id || '',
    milestoneId: e.milestone_id || e.milestone?.id || '',
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
    // Per-entry status
    status: (e.status || 'draft') as EntryStatus,
    submittedAt: e.submitted_at || undefined,
    reviewedBy: e.reviewed_by || undefined,
    reviewerName: e.reviewer ? `${e.reviewer.first_name} ${e.reviewer.last_name}` : undefined,
    reviewedAt: e.reviewed_at || undefined,
    reviewComments: e.review_comments || undefined,
    projectName: e.project?.name || '',
    projectCode: e.project?.project_code || '',
    projectColor: e.project?.color || '',
    milestoneName: e.milestone?.name || '',
    resubmissionCount: e.resubmission_count || 0,
    rejectionHistory: e.rejection_history || [],
  };
}

function mapTimesheet(ts: any): TimesheetWeek {
  const rows = (ts.entries || []).map(mapTimesheetRow);
  const totalHours = rows.reduce(
    (sum: number, r: TimesheetRow) => sum + Object.values(r.hours).reduce((a: number, b: number) => a + b, 0), 0
  );
  return {
    id: ts.id,
    userId: ts.user_id,
    weekStartDate: ts.week_start_date,
    weekEndDate: ts.week_end_date,
    totalHours,
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
    totalHours: 0,
    rows: [
      { id: generateId(), projectId: '', milestoneId: '', taskDescription: '', billable: true, hours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 }, status: 'draft' as EntryStatus },
    ],
  };
}

export const useTimesheetStore = create<TimesheetStore>((set, get) => ({
  currentTimesheet: emptyTimesheet(),
  pastTimesheets: [],
  isLoading: false,
  isSaving: false,
  _lastSavedHash: '',

  fetchTimesheets: async () => {
    set({ isLoading: true });
    try {
      const res = await timesheetAPI.getMyTimesheets();
      const data = res.data.data;
      const rows = data.rows || data;
      const all = (Array.isArray(rows) ? rows : []).map(mapTimesheet);

      const today = new Date();
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
      const thisWeekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

      const normalizeDate = (d: string) => d ? d.slice(0, 10) : '';
      const past = all.filter((t) => normalizeDate(t.weekStartDate) !== thisWeekStart);

      // Only set pastTimesheets — loadWeek handles currentTimesheet to avoid race conditions
      set({ pastTimesheets: past, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadWeek: async (weekStartDate, weekEndDate) => {
    set({ isLoading: true });
    try {
      const res = await timesheetAPI.getWeekTimesheet(weekStartDate);
      const ts = res.data.data;
      if (ts && ts.entries && ts.entries.length > 0) {
        const mapped = mapTimesheet(ts);
        // Initialize hash so auto-save doesn't immediately trigger
        const hash = JSON.stringify(mapped.rows
          .filter(r => r.projectId && ['draft', 'recalled', 'rejected'].includes(r.status) && Object.values(r.hours).some(h => h > 0))
          .map(r => ({p:r.projectId,m:r.milestoneId,t:r.taskDescription,b:r.billable,h:r.hours})));
        set({ currentTimesheet: mapped, isLoading: false, _lastSavedHash: hash });
      } else {
        // No timesheet exists — empty rows array
        set({
          currentTimesheet: {
            id: '', userId: '', weekStartDate, weekEndDate, totalHours: 0,
            rows: [],
          },
          isLoading: false,
          _lastSavedHash: '[]',
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
      status: 'draft' as EntryStatus,
    };
    set((state) => ({
      currentTimesheet: { ...state.currentTimesheet, rows: [...state.currentTimesheet.rows, newRow] },
    }));
  },

  removeRow: async (rowId) => {
    const row = get().currentTimesheet.rows.find(r => r.id === rowId);
    // If entry exists on backend (has a UUID-style id), delete it via API
    if (row && row.id && row.id.includes('-') && ['draft', 'recalled'].includes(row.status)) {
      try {
        await timesheetAPI.deleteEntry(row.id);
      } catch {
        // If API fails, still remove from UI
      }
    }
    set((state) => {
      const rows = state.currentTimesheet.rows.filter((r) => r.id !== rowId);
      const totalHours = rows.reduce(
        (sum, r) => sum + Object.values(r.hours).reduce((a, b) => a + b, 0), 0
      );
      return { currentTimesheet: { ...state.currentTimesheet, rows, totalHours } };
    });
  },

  copyFromLastWeek: async () => {
    const current = get().currentTimesheet;
    // Calculate the previous week's Monday from the current timesheet
    const currentWeekStart = current.weekStartDate;
    const prevWeekDate = new Date(currentWeekStart + 'T00:00:00');
    prevWeekDate.setDate(prevWeekDate.getDate() - 7);
    const prevWeekStart = `${prevWeekDate.getFullYear()}-${String(prevWeekDate.getMonth() + 1).padStart(2, '0')}-${String(prevWeekDate.getDate()).padStart(2, '0')}`;

    try {
      const res = await timesheetAPI.getWeekTimesheet(prevWeekStart);
      const ts = res.data.data;
      if (!ts || !ts.entries || ts.entries.length === 0) return false;

      const copiedRows: TimesheetRow[] = ts.entries.map((e: any) => ({
        id: generateId(),
        projectId: e.project_id || '',
        milestoneId: e.milestone_id || '',
        taskDescription: e.task_description || '',
        billable: e.billable ?? true,
        hours: {
          mon: Number(e.hours_mon) || 0,
          tue: Number(e.hours_tue) || 0,
          wed: Number(e.hours_wed) || 0,
          thu: Number(e.hours_thu) || 0,
          fri: Number(e.hours_fri) || 0,
          sat: Number(e.hours_sat) || 0,
          sun: Number(e.hours_sun) || 0,
        },
        status: 'draft' as EntryStatus,
        projectName: e.project?.name || '',
        projectCode: e.project?.project_code || '',
        projectColor: e.project?.color || '',
        milestoneName: e.milestone?.name || '',
      }));

      if (copiedRows.length === 0) return false;

      const totalHours = copiedRows.reduce(
        (sum, r) => sum + Object.values(r.hours).reduce((a, b) => a + b, 0), 0
      );

      set((state) => ({
        currentTimesheet: { ...state.currentTimesheet, rows: copiedRows, totalHours },
      }));

      // Auto-save the copied data as draft
      await get().saveDraft();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Save only editable (draft/recalled/rejected) entries.
   * Locked entries (submitted/approved) are preserved on the backend.
   * Local-only rows (no project or not yet saved) are preserved in the UI.
   */
  saveDraft: async () => {
    set({ isSaving: true });
    try {
      const ts = get().currentTimesheet;
      // Save draft/recalled/rejected rows
      const editableRows = ts.rows.filter((r) =>
        r.projectId && ['draft', 'recalled', 'rejected'].includes(r.status)
      );

      // UUID pattern to distinguish DB IDs from local temp IDs
      const isDbId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      const entries = editableRows.map((r) => ({
        // Existing entries: send id so backend can UPDATE in place
        // New entries: send tempId so backend can return the mapping
        ...(isDbId(r.id) ? { id: r.id } : { tempId: r.id }),
        projectId: r.projectId,
        milestoneId: r.milestoneId || null,
        taskDescription: r.taskDescription,
        billable: r.billable,
        hours: r.hours,
      }));

      if (entries.length === 0 && ts.rows.filter(r => r.projectId).length === 0) {
        set({ isSaving: false });
        return;
      }

      const res = await timesheetAPI.save({
        weekStartDate: ts.weekStartDate,
        weekEndDate: ts.weekEndDate,
        entries,
      });

      // Sync IDs: only new entries need tempIdMap, existing entries keep their ID
      const apiData = res.data.data;
      const tempIdMap: Record<string, string> = apiData?.tempIdMap || {};
      const currentTs = get().currentTimesheet;

      const updatedRows = currentTs.rows.map((row) => {
        if (!row.projectId || !['draft', 'recalled', 'rejected'].includes(row.status)) return row;
        // Only new entries (non-UUID ids) need ID sync
        if (!isDbId(row.id)) {
          const realId = tempIdMap[row.id];
          if (realId) return { ...row, id: realId };
        }
        return row;
      });

      const savedHash = JSON.stringify(updatedRows
        .filter(r => r.projectId && ['draft', 'recalled', 'rejected'].includes(r.status) && Object.values(r.hours).some(h => h > 0))
        .map(r => ({p:r.projectId,m:r.milestoneId,t:r.taskDescription,b:r.billable,h:r.hours})));
      set({
        currentTimesheet: {
          ...currentTs,
          id: apiData?.id || currentTs.id,
          userId: apiData?.user_id || currentTs.userId,
          rows: updatedRows,
        },
        isSaving: false,
        _lastSavedHash: savedHash,
      });
    } catch (err) {
      console.error('saveDraft failed:', err);
      set({ isSaving: false });
    }
  },

  /**
   * Submit specific entry IDs (per-entry submission).
   */
  submitEntries: async (entryIds) => {
    set({ isSaving: true });
    try {
      const res = await timesheetAPI.submitEntries(entryIds);
      if (res.data.data) {
        set({ currentTimesheet: mapTimesheet(res.data.data), isSaving: false });
      } else {
        set({ isSaving: false });
      }
    } catch (err) {
      console.error('submitEntries failed:', err);
      set({ isSaving: false });
    }
  },

  /**
   * Recall specific entry IDs (per-entry recall).
   */
  recallEntries: async (entryIds) => {
    set({ isSaving: true });
    try {
      const res = await timesheetAPI.recallEntries(entryIds);
      if (res.data.data) {
        set({ currentTimesheet: mapTimesheet(res.data.data), isSaving: false });
      } else {
        set({ isSaving: false });
      }
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
