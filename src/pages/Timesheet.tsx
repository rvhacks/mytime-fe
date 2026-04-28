import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Send,
  Lock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useTimesheetStore } from '@/store/timesheetStore';
import { useAdminStore } from '@/store/adminStore';
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
    pastTimesheets,
    updateRowHours,
    updateRowField,
    addRow,
    removeRow,
    saveDraft,
    submitTimesheet,
    isSaving,
  } = useTimesheetStore();

  const { projects } = useAdminStore();
  const [weekOffset, setWeekOffset] = useState(0);

  // Compute the Monday of the current (real) week and the displayed week
  const thisMonday = useMemo(() => getMonday(new Date()), []);
  const displayMonday = useMemo(() => shiftWeek(thisMonday, weekOffset), [thisMonday, weekOffset]);
  const days = useMemo(() => buildDays(displayMonday), [displayMonday]);

  // Determine which timesheet to show
  const isCurrentWeek = weekOffset === 0;

  const activeTimesheet = useMemo(() => {
    if (isCurrentWeek) return currentTimesheet;
    // Match past timesheets by comparing weekStartDate
    const displayStart = displayMonday.toISOString().slice(0, 10);
    const match = pastTimesheets.find((ts) => ts.weekStartDate === displayStart);
    return match || null;
  }, [isCurrentWeek, currentTimesheet, pastTimesheets, displayMonday]);

  const isLocked =
    !isCurrentWeek ||
    activeTimesheet?.status === 'submitted' ||
    activeTimesheet?.status === 'approved';

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

  // Auto-save draft on any change (debounced) — no toast, no isSaving
  const isFirstRender = useRef(true);
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!isCurrentWeek || isLocked) return;
    setAutoSaveState('idle');
    const timer = setTimeout(async () => {
      setAutoSaveState('saving');
      // Simulate save without using store's isSaving
      await new Promise((r) => setTimeout(r, 600));
      setAutoSaveState('saved');
      setTimeout(() => setAutoSaveState('idle'), 1500);
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentTimesheet.rows, isCurrentWeek, isLocked]);

  const handleSubmit = async () => {
    if (currentTimesheet.rows.length === 0) {
      toast.error('Add at least one row before submitting');
      return;
    }
    await submitTimesheet();
    toast.success('Timesheet submitted for approval');
  };

  const goToPrevWeek = () => setWeekOffset((o) => o - 1);
  const goToNextWeek = () => setWeekOffset((o) => Math.min(0, o + 1)); // can't go past current week
  const goToThisWeek = () => setWeekOffset(0);

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
    return <StatusBadge status={activeTimesheet.status} />;
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Timesheet</h1>
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

          {/* Submit — only on current week and not locked */}
          {isCurrentWeek && !isLocked && (
            <Button size="sm" onClick={handleSubmit} isLoading={isSaving}>
              <Send className="w-4 h-4" />
              Submit
            </Button>
          )}
        </div>
      </div>

      {/* Locked Banner */}
      {activeTimesheet && isLocked && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800"
        >
          <Lock className="w-5 h-5 text-brand-500" />
          <p className="text-sm text-brand-700 dark:text-brand-300">
            {isCurrentWeek
              ? `This timesheet has been ${activeTimesheet.status} and is locked for editing.`
              : 'You are viewing a past week. Navigate to the current week to make edits.'}
          </p>
        </motion.div>
      )}

      {/* Empty State for past weeks with no data */}
      {!activeTimesheet && !isCurrentWeek && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-10 h-10 mx-auto text-[var(--text-tertiary)] mb-3" />
            <p className="text-lg font-medium text-[var(--text-primary)]">No timesheet for this week</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              No timesheet was submitted for {formatWeekRange(displayMonday)}
            </p>
            <Button size="sm" className="mt-4" onClick={goToThisWeek}>
              Go to This Week
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Timesheet Grid */}
      {activeTimesheet && (
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
                      {days.map((day) => (
                        <th key={day.key} className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4 w-16">
                          <div>{day.label}</div>
                          <div className="text-[10px] text-[var(--text-tertiary)] font-normal">{day.date}</div>
                        </th>
                      ))}
                      <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4 w-16">
                        Total
                      </th>
                      {!isLocked && <th className="w-12 p-4" />}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {rows.map((row) => {
                        const selectedProject = projects.find((p) => p.id === row.projectId);
                        const milestones = selectedProject?.milestones || [];

                        return (
                          <motion.tr
                            key={row.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-b border-[var(--border-secondary)] last:border-0 group"
                          >
                            {/* Project */}
                            <td className="p-3">
                              <select
                                value={row.projectId}
                                onChange={(e) => updateRowField(row.id, 'projectId', e.target.value)}
                                disabled={isLocked}
                                className="w-full h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50"
                              >
                                <option value="">Select project</option>
                                {projects.filter((p) => p.status === 'active').map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </td>

                            {/* Milestone */}
                            <td className="p-3">
                              <select
                                value={row.milestoneId}
                                onChange={(e) => updateRowField(row.id, 'milestoneId', e.target.value)}
                                disabled={isLocked || !row.projectId}
                                className="w-full h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50"
                              >
                                <option value="">Select milestone</option>
                                {milestones.map((m) => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                              </select>
                            </td>

                            {/* Task Description */}
                            <td className="p-3">
                              <input
                                type="text"
                                value={row.taskDescription}
                                onChange={(e) => updateRowField(row.id, 'taskDescription', e.target.value)}
                                disabled={isLocked}
                                placeholder="What did you work on?"
                                className="w-full h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 placeholder:text-[var(--text-tertiary)]"
                              />
                            </td>

                            {/* Billable Checkbox */}
                            <td className="p-3 text-center">
                              <label className="inline-flex items-center justify-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={row.billable}
                                  onChange={(e) => updateRowField(row.id, 'billable', e.target.checked as any)}
                                  disabled={isLocked}
                                  className="sr-only peer"
                                />
                                <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                                  row.billable
                                    ? 'bg-accent-500 border-accent-500'
                                    : 'border-[var(--input-border)] bg-[var(--input-bg)]'
                                } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent-400'}`}>
                                  {row.billable && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </label>
                            </td>

                            {/* Day Hours */}
                            {days.map((day) => (
                              <td key={day.key} className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="24"
                                  step="0.5"
                                  value={row.hours[day.key] || ''}
                                  onChange={(e) => updateRowHours(row.id, day.key, parseFloat(e.target.value) || 0)}
                                  disabled={isLocked}
                                  className="w-14 h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-center text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </td>
                            ))}

                            {/* Row Total */}
                            <td className="p-3 text-center">
                              <span className="text-sm font-semibold text-[var(--text-primary)]">
                                {getRowTotal(row.hours)}h
                              </span>
                            </td>

                            {/* Delete */}
                            {!isLocked && (
                              <td className="p-3">
                                <button
                                  onClick={() => removeRow(row.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>

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
                      {!isLocked && <td />}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Add Row */}
              {!isLocked && (
                <div className="p-4 border-t border-[var(--border-secondary)]">
                  <Button variant="ghost" size="sm" onClick={addRow} className="text-brand-500 hover:text-brand-600">
                    <Plus className="w-4 h-4" />
                    Add Row
                  </Button>
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
