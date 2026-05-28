import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Send,
  Lock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  RotateCcw,
  History,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useTimesheetStore } from '@/store/timesheetStore';
import { timesheetAPI } from '@/services/api';
import type { TimesheetWeek, TimesheetRow } from '@/types';
import toast, { Toaster } from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Week date helpers
// ---------------------------------------------------------------------------

/** Get the Monday of the week containing `date` */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Shift a Monday by `offset` weeks (negative = past) */
function shiftWeek(monday: Date, offset: number): Date {
  const d = new Date(monday);
  d.setDate(d.getDate() + offset * 7);
  return d;
}

/** Build the 7-day column headers for the given week-start Monday */
function buildDays(monday: Date) {
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return dayLabels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return {
      key: dayKeys[i],
      label,
      date: d.getDate().toString(),
    };
  });
}

/** Format a date range like "Apr 20 – Apr 26, 2026" */
function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const year = sunday.getFullYear();
  return `${fmt(monday)} – ${fmt(sunday)}, ${year}`;
}

/** Return a label for the week selector pill */
function getWeekLabel(offset: number): string {
  if (offset === 0) return 'This Week';
  if (offset === -1) return 'Last Week';
  if (offset === 1) return 'Next Week';
  return `${Math.abs(offset)} weeks ${offset < 0 ? 'ago' : 'ahead'}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Timesheet() {
  const {
    currentTimesheet,
    updateRowHours,
    updateRowField,
    addRow,
    removeRow,
    saveDraft,
    submitEntries,
    recallEntries,
    copyFromLastWeek,
    isSaving,
    fetchTimesheets,
    _lastSavedHash,
  } = useTimesheetStore();

  const navigate = useNavigate();

  // ---- Read-only View Mode (for RM/Admin viewing employee timesheet) ----
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const viewEmployeeId = urlParams.get('viewEmployeeId');
  const viewEmployeeName = urlParams.get('viewEmployeeName');
  const isViewOnly = !!viewEmployeeId;

  // Separate state for the viewed employee's timesheet to avoid polluting the user's own store
  const [viewOnlyTimesheet, setViewOnlyTimesheet] = useState<TimesheetWeek | null>(null);
  const [viewOnlyLoading, setViewOnlyLoading] = useState(false);

  const [assignedProjects, setAssignedProjects] = useState<{id:string;name:string;code:string;status:string;role:string}[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    if (isViewOnly) {
      // In view-only mode, we don't fetch the logged-in user's timesheets or projects
      setProjectsLoading(false);
      return;
    }
    fetchTimesheets();
    setProjectsLoading(true);
    timesheetAPI.getAssignedProjects().then((res) => {
      const raw = res.data.data || [];
      setAssignedProjects(raw.map((p: any) => ({
        id: p.id,
        name: p.name || '',
        code: p.project_code || '',
        status: p.status || 'active',
        role: p.assignment_role || '',
      })));
    }).catch(() => {}).finally(() => setProjectsLoading(false));
  }, []);

  // Role-based milestones: keyed by role string
  const [milestonesByRole, setMilestonesByRole] = useState<Record<string, {id:string;name:string}[]>>({});
  const fetchMilestonesForRole = useCallback(async (role: string) => {
    if (!role || milestonesByRole[role]) return;
    try {
      const res = await timesheetAPI.getMilestonesByRole(role);
      const data = res.data.data || [];
      setMilestonesByRole((prev) => ({ ...prev, [role]: data.map((m: any) => ({ id: m.id, name: m.name })) }));
    } catch { /* ignore */ }
  }, [milestonesByRole]);

  // When a project is selected, auto-fetch milestones for its role
  const getMilestonesForProject = (projectId: string) => {
    const proj = assignedProjects.find((p) => p.id === projectId);
    if (!proj || !proj.role) return [];
    return milestonesByRole[proj.role] || [];
  };

  // Auto-fetch milestones for all roles used by existing timesheet rows
  useEffect(() => {
    if (assignedProjects.length === 0) return;
    const roles = new Set<string>();
    currentTimesheet.rows.forEach((row) => {
      if (row.projectId) {
        const proj = assignedProjects.find((p) => p.id === row.projectId);
        if (proj?.role && !milestonesByRole[proj.role]) roles.add(proj.role);
      }
    });
    roles.forEach((role) => fetchMilestonesForRole(role));
  }, [assignedProjects, currentTimesheet.id]); // re-run when timesheet or projects load

  const [weekOffset, setWeekOffset] = useState(() => {
    // Check for weekStart URL param to navigate to specific week
    const params = new URLSearchParams(window.location.search);
    const ws = params.get('weekStart');
    if (ws) {
      const target = getMonday(new Date(ws + 'T00:00:00'));
      const current = getMonday(new Date());
      const diff = Math.round((target.getTime() - current.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return diff;
    }
    return 0;
  });

  // Compute the Monday of the current (real) week and the displayed week
  const thisMonday = useMemo(() => getMonday(new Date()), []);
  const displayMonday = useMemo(() => shiftWeek(thisMonday, weekOffset), [thisMonday, weekOffset]);
  const days = useMemo(() => buildDays(displayMonday), [displayMonday]);

  // Determine which timesheet to show
  const isCurrentWeek = weekOffset === 0;

  // In view-only mode use the separate state; otherwise use the store
  const activeTimesheet = isViewOnly ? viewOnlyTimesheet : currentTimesheet;

  // Backdate support: allow editing past weeks (configurable limit)
  const BACKDATE_LIMIT_WEEKS = 4;
  const isBackdatedBeyondLimit = weekOffset < -BACKDATE_LIMIT_WEEKS;
  // Per-row locking: a row is locked if its status is submitted or approved
  const isRowLocked = (status: string) => ['submitted', 'resubmitted', 'approved'].includes(status);
  // Global lock: either backdate limit OR view-only mode
  const isGlobalLocked = isBackdatedBeyondLimit || isViewOnly;
  // Legacy compat
  const isLocked = isGlobalLocked;

  // Computed totals
  const rows = activeTimesheet?.rows || [];
  const totalHours = activeTimesheet?.totalHours ?? 0;

  const getRowTotal = (hours: Record<string, number>) =>
    Object.values(hours).reduce((a, b) => a + b, 0);

  const getDayTotal = (day: string) =>
    rows.reduce((sum, row) => sum + (row.hours[day] || 0), 0);

  const billableHours = rows
    .filter((r) => r.billable)
    .reduce((sum, r) => sum + Object.values(r.hours).reduce((a, b) => a + b, 0), 0);

  const nonBillableHours = totalHours - billableHours;

  // Auto-save draft on any change (debounced) — only when meaningful data exists
  const isFirstRender = useRef(true);
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isLocked || isViewOnly) return;
    // A row is "saveable" only when it has project + at least 1 hour entered
    const saveableRows = currentTimesheet.rows.filter(r =>
      r.projectId &&
      ['draft', 'recalled'].includes(r.status) &&
      Object.values(r.hours).some(h => h > 0)
    );
    // Don't auto-save if no saveable rows exist
    if (saveableRows.length === 0) return;
    // Build hash only from saveable rows to detect real changes
    const currentHash = JSON.stringify(saveableRows.map(r => ({p:r.projectId,m:r.milestoneId,t:r.taskDescription,b:r.billable,h:r.hours})));
    // Skip if nothing changed from last save
    if (currentHash === _lastSavedHash) return;
    setAutoSaveState('idle');
    const timer = setTimeout(async () => {
      setAutoSaveState('saving');
      await saveDraft();
      setAutoSaveState('saved');
      setTimeout(() => setAutoSaveState('idle'), 1500);
    }, 1200);
    return () => clearTimeout(timer);
  }, [currentTimesheet.rows, isLocked, _lastSavedHash]);

  // Per-entry submit: submit all draft rows that have a project selected
  const handleSubmitAll = async () => {
    const ts = useTimesheetStore.getState().currentTimesheet;
    const drafts = ts.rows.filter((r) => r.projectId && ['draft', 'recalled', 'rejected'].includes(r.status));
    // Validate milestone is selected for all draft entries
    const missingMilestone = drafts.filter((r) => !r.milestoneId);
    if (missingMilestone.length > 0) {
      toast.error('Please select a milestone for all entries before submitting');
      return;
    }
    await saveDraft();
    // Wait a tick for state to update with saved IDs
    await new Promise(r => setTimeout(r, 300));
    const updatedTs = useTimesheetStore.getState().currentTimesheet;
    const draftIds = updatedTs.rows
      .filter((r) => r.projectId && ['draft', 'recalled', 'rejected'].includes(r.status))
      .map((r) => r.id);
    if (draftIds.length === 0) {
      toast.error('No draft entries to submit');
      return;
    }
    await submitEntries(draftIds);
    toast.success(`${draftIds.length} entries submitted for approval`);
  };

  const handleRecallAll = async () => {
    const submittedIds = rows.filter(r => r.status === 'submitted' || r.status === 'resubmitted').map(r => r.id);
    if (submittedIds.length === 0) return;
    await recallEntries(submittedIds);
    toast.success('Entries recalled');
  };

  const goToPrevWeek = () => setWeekOffset((o) => o - 1);
  const goToNextWeek = () => setWeekOffset((o) => o + 1); // allow future weeks too
  const goToThisWeek = () => setWeekOffset(0);

  // Load week from API on every week change (including current week)
  const { loadWeek } = useTimesheetStore();
  const formatLocalDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  useEffect(() => {
    const monday = shiftWeek(thisMonday, weekOffset);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const start = formatLocalDate(monday);
    const end = formatLocalDate(sunday);
    if (isViewOnly && viewEmployeeId) {
      // Fetch the employee's timesheet via the view API
      setViewOnlyLoading(true);
      timesheetAPI.viewEmployeeWeekTimesheet(viewEmployeeId, start)
        .then((res) => {
          const ts = res.data.data;
          if (ts && ts.entries && ts.entries.length > 0) {
            const rows: TimesheetRow[] = (ts.entries || []).map((e: any) => ({
              id: e.id,
              projectId: e.project_id || e.project?.id || '',
              milestoneId: e.milestone_id || e.milestone?.id || '',
              taskDescription: e.task_description || '',
              billable: e.billable !== false,
              hours: {
                mon: Number(e.hours_mon) || 0, tue: Number(e.hours_tue) || 0,
                wed: Number(e.hours_wed) || 0, thu: Number(e.hours_thu) || 0,
                fri: Number(e.hours_fri) || 0, sat: Number(e.hours_sat) || 0,
                sun: Number(e.hours_sun) || 0,
              },
              status: (e.status || 'draft'),
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
            }));
            const totalHours = rows.reduce((s, r) => s + Object.values(r.hours).reduce((a, b) => a + b, 0), 0);
            setViewOnlyTimesheet({
              id: ts.id, userId: ts.user_id, weekStartDate: start, weekEndDate: end,
              totalHours, rows,
            });
          } else {
            setViewOnlyTimesheet({ id: '', userId: '', weekStartDate: start, weekEndDate: end, totalHours: 0, rows: [] });
          }
        })
        .catch(() => {
          setViewOnlyTimesheet({ id: '', userId: '', weekStartDate: start, weekEndDate: end, totalHours: 0, rows: [] });
        })
        .finally(() => setViewOnlyLoading(false));
    } else {
      loadWeek(start, end);
    }
  }, [weekOffset]);

  // Status badge with auto-save indicator
  const renderStatusBadge = () => {
    if (!activeTimesheet) return null;
    if (autoSaveState === 'saving') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
          Saving…
        </span>
      );
    }
    if (autoSaveState === 'saved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 transition-all">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Draft saved
        </span>
      );
    }
    // Show aggregate status from entries
    const statuses = (activeTimesheet?.rows || []).map(r => r.status);
    const allApproved = statuses.length > 0 && statuses.every(s => s === 'approved');
    const hasSubmitted = statuses.some(s => s === 'submitted');
    const hasResubmitted = statuses.some(s => s === 'resubmitted');
    const hasRejected = statuses.some(s => s === 'rejected');
    const aggStatus = allApproved ? 'approved' : hasSubmitted ? 'submitted' : hasResubmitted ? 'resubmitted' : hasRejected ? 'rejected' : 'draft';
    return <StatusBadge status={aggStatus} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {isViewOnly ? `${viewEmployeeName || 'Employee'}'s Timesheet` : 'Timesheet'}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[var(--text-secondary)] text-sm">
              Week: {formatWeekRange(displayMonday)}
            </p>
            {renderStatusBadge()}
            {!activeTimesheet && !isCurrentWeek && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-800 text-[var(--text-tertiary)]">
                No data
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Week Navigator */}
          <div className="flex items-center gap-1 mr-2 bg-[var(--bg-tertiary)] rounded-lg p-0.5">
            <button
              onClick={goToPrevWeek}
              className="p-1.5 rounded-md hover:bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {isCurrentWeek ? (
              <span className="text-sm font-medium px-3 py-1 text-[var(--text-primary)]">
                {getWeekLabel(weekOffset)}
              </span>
            ) : (
              <button
                onClick={goToThisWeek}
                className="text-sm font-medium px-3 py-1 rounded-md text-brand-500 hover:bg-[var(--card-bg)] transition-colors"
              >
                {getWeekLabel(weekOffset)}
              </button>
            )}
            <button
              onClick={goToNextWeek}
              disabled={weekOffset >= 0}
              className="p-1.5 rounded-md hover:bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Back button for view-only mode */}
          {isViewOnly && (
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          {/* Submit / Recall — hidden in view-only mode */}
          {!isViewOnly && !isGlobalLocked && rows.some(r => ['draft','recalled','rejected'].includes(r.status) && r.projectId) && (
            <Button size="sm" onClick={handleSubmitAll} isLoading={isSaving}>
              <Send className="w-4 h-4" />
              Submit All
            </Button>
          )}
          {!isViewOnly && !isGlobalLocked && rows.some(r => r.status === 'submitted' || r.status === 'resubmitted') && (
            <Button size="sm" variant="outline" onClick={handleRecallAll} isLoading={isSaving}>
              Recall Submitted
            </Button>
          )}
        </div>
      </div>

      {/* View-Only Banner */}
      {isViewOnly && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
        >
          <Eye className="w-5 h-5 text-blue-500" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Viewing <strong>{viewEmployeeName || 'employee'}</strong>'s timesheet (read-only)
          </p>
        </motion.div>
      )}

      {/* Locked Banner — only for backdate limit (not in view-only mode) */}
      {!isViewOnly && activeTimesheet && isGlobalLocked && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800"
        >
          <Lock className="w-5 h-5 text-brand-500" />
          <p className="text-sm text-brand-700 dark:text-brand-300">
            This week is beyond the editable window.
          </p>
        </motion.div>
      )}

      {/* Empty State — no rows at all */}
      {rows.length === 0 && !isBackdatedBeyondLimit && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-10 h-10 mx-auto text-[var(--text-tertiary)] mb-3" />
            <p className="text-lg font-medium text-[var(--text-primary)]">
              {isViewOnly ? 'No timesheet entries for this week' : 'No timesheet submitted for this week'}
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              {formatWeekRange(displayMonday)}
            </p>
            {!isViewOnly && (
              <Button size="sm" className="mt-4" onClick={() => addRow()}>
                <Plus className="w-4 h-4" />
                Add Timesheet Entry
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timesheet Grid */}
      {rows.length > 0 && (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border-secondary)]">
                      <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4 w-48">
                        Project
                      </th>
                      <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4 w-40">
                        Milestone
                      </th>
                      <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4 w-56">
                        Task
                      </th>
                      <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4 w-20">
                        Billable
                      </th>
                      {days.map((day) => {
                        const isWe = day.key === 'sat' || day.key === 'sun';
                        return (
                          <th key={day.key} className={`text-center text-xs font-medium uppercase tracking-wider p-4 w-16 ${isWe ? 'text-[var(--text-tertiary)] opacity-60 bg-[var(--bg-tertiary)]/30' : 'text-[var(--text-tertiary)]'}`}>
                            <div>{day.label}</div>
                            <div className="text-[10px] text-[var(--text-tertiary)] font-normal">{day.date}</div>
                          </th>
                        );
                      })}
                      <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4 w-16">
                        Total
                      </th>
                      <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4 w-20">
                        Status
                      </th>
                      {!isGlobalLocked && <th className="w-12 p-4" />}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Rows */}
                      {rows.map((row) => {
                        const rowMilestones = getMilestonesForProject(row.projectId);
                        const locked = isGlobalLocked || isRowLocked(row.status);

                        return (
                          <tr
                            key={row.id}
                            className={`border-b border-[var(--border-secondary)] last:border-0 group ${locked ? 'opacity-80' : ''}`}
                          >
                            {/* Project */}
                            <td className="p-3">
                              {isViewOnly ? (
                                <span className="text-sm text-[var(--text-primary)] font-medium">{row.projectName || row.projectCode || '—'}</span>
                              ) : (
                              <select
                                value={row.projectId}
                                onChange={(e) => {
                                  const projectId = e.target.value;
                                  updateRowField(row.id, 'projectId', projectId);
                                  updateRowField(row.id, 'milestoneId', '');
                                  const proj = assignedProjects.find((p) => p.id === projectId);
                                  if (proj?.role) fetchMilestonesForRole(proj.role);
                                }}
                                disabled={locked}
                                className="w-full h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] pl-2 pr-8 truncate appearance-none bg-[length:16px_16px] bg-[right_0.5rem_center] bg-no-repeat bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50"
                              >
                                <option value="">Select project</option>
                                {assignedProjects.filter((p) => p.status === 'active').map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                              )}
                            </td>
                            {/* Milestone */}
                            <td className="p-3">
                              {isViewOnly ? (
                                <span className="text-sm text-[var(--text-secondary)]">{row.milestoneName || '—'}</span>
                              ) : (
                              <select
                                value={row.milestoneId}
                                onChange={(e) => updateRowField(row.id, 'milestoneId', e.target.value)}
                                disabled={locked || !row.projectId}
                                className="w-full h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] pl-2 pr-8 truncate appearance-none bg-[length:16px_16px] bg-[right_0.5rem_center] bg-no-repeat bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50"
                              >
                                <option value="">Select milestone</option>
                                {rowMilestones.map((m) => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                              </select>
                              )}
                            </td>
                            {/* Task */}
                            <td className="p-3">
                              <input type="text" value={row.taskDescription}
                                onChange={(e) => updateRowField(row.id, 'taskDescription', e.target.value)}
                                disabled={locked} placeholder="What did you work on?"
                                className="w-full h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 placeholder:text-[var(--text-tertiary)]"
                              />
                            </td>
                            {/* Billable */}
                            <td className="p-3 text-center">
                              <label className="inline-flex items-center justify-center cursor-pointer">
                                <input type="checkbox" checked={row.billable}
                                  onChange={(e) => updateRowField(row.id, 'billable', e.target.checked as any)}
                                  disabled={locked} className="sr-only peer" />
                                <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                                  row.billable ? 'bg-accent-500 border-accent-500' : 'border-[var(--input-border)] bg-[var(--input-bg)]'
                                } ${locked ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent-400'}`}>
                                  {row.billable && (<svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>)}
                                </div>
                              </label>
                            </td>
                            {/* Day Hours */}
                            {days.map((day) => {
                              const isWeekend = day.key === 'sat' || day.key === 'sun';
                              return (
                                <td key={day.key} className={`p-2 ${isWeekend ? 'bg-[var(--bg-tertiary)]/50' : ''}`}>
                                  <input type="number" min="0" max="24" step="0.5"
                                    value={row.hours[day.key] || ''}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      // Calculate total hours for this day across ALL rows (excluding current row)
                                      const otherRowsTotal = rows.reduce((sum, r) => {
                                        if (r.id === row.id) return sum;
                                        return sum + (r.hours[day.key] || 0);
                                      }, 0);
                                      if (otherRowsTotal + val > 24) {
                                        toast.error(`Daily total cannot exceed 24 hours (${day.label})`, { id: `max24-${day.key}` });
                                        return;
                                      }
                                      if (isWeekend && val > 0) toast('Weekend hours logged.', { icon: '⚠️', id: `we-${row.id}-${day.key}` });
                                      updateRowHours(row.id, day.key, val);
                                    }}
                                    disabled={locked}
                                    className={`w-14 h-9 rounded-lg border border-[var(--input-border)] text-sm text-center text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                      isWeekend ? 'bg-[var(--bg-tertiary)] opacity-60' : 'bg-[var(--input-bg)]'}`}
                                  />
                                </td>
                              );
                            })}
                            {/* Row Total */}
                            <td className="p-3 text-center">
                              <span className="text-sm font-semibold text-[var(--text-primary)]">{getRowTotal(row.hours)}h</span>
                            </td>
                            {/* Per-Row Status Badge */}
                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <StatusBadge status={row.status || 'draft'} />
                                {row.status === 'rejected' && row.reviewComments && (
                                  <div className="max-w-[140px] px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30" title={row.reviewComments}>
                                    <p className="text-[9px] text-red-600 dark:text-red-300 truncate">
                                      Reason: {row.reviewComments}
                                    </p>
                                  </div>
                                )}
                                {(row.resubmissionCount || 0) > 0 && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" title="This entry was resubmitted after rejection">
                                    <RotateCcw className="w-2.5 h-2.5" />
                                    Resubmitted
                                  </span>
                                )}
                                {row.rejectionHistory && row.rejectionHistory.length > 0 && (
                                  <details className="group relative">
                                    <summary className="inline-flex items-center gap-0.5 cursor-pointer text-[9px] text-red-500 hover:text-red-700 dark:text-red-400">
                                      <History className="w-2.5 h-2.5" />
                                      {row.rejectionHistory.length} rejection{row.rejectionHistory.length > 1 ? 's' : ''}
                                    </summary>
                                    <div className="absolute z-50 right-0 mt-1 w-64 p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-secondary)] shadow-xl space-y-1.5 text-left">
                                      {row.rejectionHistory.map((rh, idx) => (
                                        <div key={idx} className="p-2 rounded bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
                                          <div className="flex justify-between items-center mb-0.5">
                                            <span className="text-[10px] font-medium text-red-700 dark:text-red-400">{rh.reviewerName || 'Manager'}</span>
                                            <span className="text-[9px] text-red-500">{rh.rejectedAt ? new Date(rh.rejectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                                          </div>
                                          <p className="text-[10px] text-red-600 dark:text-red-300">{rh.comments || 'No remarks'}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                )}
                              </div>
                            </td>
                            {/* Delete — only for editable rows */}
                            {!isGlobalLocked && (
                              <td className="p-3">
                                {!isRowLocked(row.status) ? (
                                  <button onClick={() => removeRow(row.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <Lock className="w-4 h-4 text-[var(--text-tertiary)] mx-auto" />
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}

                    {/* Totals Row */}
                    <tr className="bg-[var(--bg-tertiary)]">
                      <td colSpan={4} className="p-4">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">Daily Total</span>
                      </td>
                      {days.map((day) => (
                        <td key={day.key} className="p-3 text-center">
                          <span className={`text-sm font-semibold ${getDayTotal(day.key) > 8 ? 'text-warning-500' : 'text-[var(--text-primary)]'}`}>
                            {getDayTotal(day.key)}h
                          </span>
                        </td>
                      ))}
                      <td className="p-3 text-center">
                        <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                          {totalHours}h
                        </span>
                      </td>
                      <td />
                      {!isGlobalLocked && <td />}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Add Row */}
              {!isGlobalLocked && (
                <div className="p-4 border-t border-[var(--border-secondary)] flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={addRow} className="text-brand-500 hover:text-brand-600">
                    <Plus className="w-4 h-4" />
                    Add Row
                  </Button>
                  {(() => {
                    // Only enable Copy from Last Week when current week has no real data entered
                    const hasData = rows.some(r => r.projectId && (Object.values(r.hours).some(h => h > 0) || r.taskDescription));
                    return (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={hasData}
                        onClick={async () => {
                          const success = await copyFromLastWeek();
                          if (success) {
                            toast.success('Copied rows from last week');
                          } else {
                            toast.error('No previous timesheet found to copy from');
                          }
                        }}
                        className={`${hasData ? 'opacity-40 cursor-not-allowed' : ''} text-[var(--text-secondary)] hover:text-[var(--text-primary)]`}
                        title={hasData ? 'Available only when no data is entered in the current week' : 'Copy project rows from last week'}
                      >
                        <Copy className="w-4 h-4" />
                        Copy from Last Week
                      </Button>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hours Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-[var(--text-secondary)]">Total Logged</p>
                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{totalHours}h</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-[var(--text-secondary)]">Expected</p>
                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">40h</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-[var(--text-secondary)]">Remaining</p>
                <p className={`text-2xl font-bold mt-1 ${40 - totalHours > 0 ? 'text-warning-500' : 'text-accent-500'}`}>
                  {Math.max(0, 40 - totalHours)}h
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-accent-500">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-accent-600 dark:text-accent-400">Billable</p>
                <p className="text-2xl font-bold text-accent-600 dark:text-accent-400 mt-1">{billableHours}h</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-warning-500">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-warning-600 dark:text-warning-400">Non-Billable</p>
                <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">{nonBillableHours}h</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </motion.div>
  );
}
