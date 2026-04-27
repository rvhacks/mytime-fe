import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Save,
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

const DAYS = [
  { key: 'mon', label: 'Mon', date: '21' },
  { key: 'tue', label: 'Tue', date: '22' },
  { key: 'wed', label: 'Wed', date: '23' },
  { key: 'thu', label: 'Thu', date: '24' },
  { key: 'fri', label: 'Fri', date: '25' },
  { key: 'sat', label: 'Sat', date: '26' },
  { key: 'sun', label: 'Sun', date: '27' },
];

export default function Timesheet() {
  const {
    currentTimesheet,
    updateRowHours,
    updateRowField,
    addRow,
    removeRow,
    saveDraft,
    submitTimesheet,
    isSaving,
  } = useTimesheetStore();

  const { projects } = useAdminStore();
  const isLocked = currentTimesheet.status === 'submitted' || currentTimesheet.status === 'approved';

  const handleSaveDraft = async () => {
    await saveDraft();
    toast.success('Draft saved successfully');
  };

  const handleSubmit = async () => {
    if (currentTimesheet.rows.length === 0) {
      toast.error('Add at least one row before submitting');
      return;
    }
    await submitTimesheet();
    toast.success('Timesheet submitted for approval');
  };

  const getRowTotal = (hours: Record<string, number>) =>
    Object.values(hours).reduce((a, b) => a + b, 0);

  const getDayTotal = (day: string) =>
    currentTimesheet.rows.reduce((sum, row) => sum + (row.hours[day] || 0), 0);

  const billableHours = currentTimesheet.rows
    .filter((r) => r.billable)
    .reduce((sum, r) => sum + Object.values(r.hours).reduce((a, b) => a + b, 0), 0);

  const nonBillableHours = currentTimesheet.totalHours - billableHours;

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
              Week: Apr 20 – Apr 26, 2026
            </p>
            <StatusBadge status={currentTimesheet.status} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <button className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-[var(--text-primary)] px-2">This Week</span>
            <button className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {!isLocked && (
            <>
              <Button variant="outline" size="sm" onClick={handleSaveDraft} isLoading={isSaving}>
                <Save className="w-4 h-4" />
                Save Draft
              </Button>
              <Button size="sm" onClick={handleSubmit} isLoading={isSaving}>
                <Send className="w-4 h-4" />
                Submit
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Locked Banner */}
      {isLocked && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800"
        >
          <Lock className="w-5 h-5 text-brand-500" />
          <p className="text-sm text-brand-700 dark:text-brand-300">
            This timesheet has been {currentTimesheet.status} and is locked for editing.
          </p>
        </motion.div>
      )}

      {/* Timesheet Grid */}
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
                  {DAYS.map((day) => (
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
                  {currentTimesheet.rows.map((row) => {
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
                        {DAYS.map((day) => (
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
                  {DAYS.map((day) => (
                    <td key={day.key} className="p-3 text-center">
                      <span className={`text-sm font-semibold ${getDayTotal(day.key) > 8 ? 'text-warning-500' : 'text-[var(--text-primary)]'}`}>
                        {getDayTotal(day.key)}h
                      </span>
                    </td>
                  ))}
                  <td className="p-3 text-center">
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                      {currentTimesheet.totalHours}h
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
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{currentTimesheet.totalHours}h</p>
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
            <p className={`text-2xl font-bold mt-1 ${40 - currentTimesheet.totalHours > 0 ? 'text-warning-500' : 'text-accent-500'}`}>
              {Math.max(0, 40 - currentTimesheet.totalHours)}h
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
    </motion.div>
  );
}
