import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, MessageSquare, Filter, Clock, Users, Eye, RotateCcw, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/States';
import { Textarea } from '@/components/ui/textarea';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import toast, { Toaster } from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Approvals() {
  const { user } = useAuthStore();
  const { approvals, fetchApprovals, approveEntries, rejectEntries, isLoading } = useAdminStore();
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [viewDialog, setViewDialog] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchApprovals();
  }, []);

  // Group entries by employee
  const grouped = approvals.reduce((acc, entry) => {
    const key = entry.userId;
    if (!acc[key]) acc[key] = { userName: entry.userName, entries: [] };
    acc[key].entries.push(entry);
    return acc;
  }, {} as Record<string, { userName: string; entries: typeof approvals }>);

  const toggleEntry = (id: string) => {
    setSelectedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedEntries.size === approvals.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(approvals.map((a) => a.id)));
    }
  };

  const handleApproveSelected = async () => {
    const ids = Array.from(selectedEntries);
    if (ids.length === 0) { toast.error('Select at least one entry'); return; }
    await approveEntries(ids);
    setSelectedEntries(new Set());
    toast.success(`${ids.length} entries approved`);
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    await rejectEntries([rejectDialog], rejectComment || 'Rejected');
    setRejectDialog(null);
    setRejectComment('');
    setSelectedEntries((prev) => { const n = new Set(prev); n.delete(rejectDialog); return n; });
    toast.success('Entry rejected');
  };

  const handleApproveOne = async (id: string) => {
    await approveEntries([id]);
    toast.success('Entry approved');
  };

  const viewEntry = viewDialog ? approvals.find((a) => a.id === viewDialog) : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Approvals</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {approvals.length} pending {approvals.length === 1 ? 'entry' : 'entries'} from your direct reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedEntries.size > 0 && (
            <Button size="sm" onClick={handleApproveSelected}>
              <CheckCircle2 className="w-4 h-4" />
              Approve ({selectedEntries.size})
            </Button>
          )}
        </div>
      </div>

      {/* Empty */}
      {approvals.length === 0 && !isLoading && (
        <EmptyState
          icon={<CheckCircle2 className="w-12 h-12" />}
          title="No pending approvals"
          description="All timesheet entries have been reviewed."
        />
      )}

      {/* Grouped by Employee */}
      {Object.entries(grouped).map(([userId, group]) => (
        <Card key={userId}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Avatar name={group.userName} size="sm" />
              <div>
                <CardTitle className="text-base">{group.userName}</CardTitle>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {group.entries.length} pending {group.entries.length === 1 ? 'entry' : 'entries'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)]">
                    <th className="p-3 w-10">
                      <input type="checkbox"
                        checked={group.entries.every((e) => selectedEntries.has(e.id))}
                        onChange={() => {
                          const allSelected = group.entries.every((e) => selectedEntries.has(e.id));
                          setSelectedEntries((prev) => {
                            const next = new Set(prev);
                            group.entries.forEach((e) => allSelected ? next.delete(e.id) : next.add(e.id));
                            return next;
                          });
                        }}
                        className="rounded border-[var(--input-border)]"
                      />
                    </th>
                    <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase p-3">Week</th>
                    <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase p-3">Project</th>
                    <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase p-3">Milestone</th>
                    {DAY_LABELS.map((d) => (
                      <th key={d} className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase p-2 w-12">{d}</th>
                    ))}
                    <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase p-3">Total</th>
                    <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.entries.map((entry) => {
                    const entryTotal = Object.values(entry.hours).reduce((a, b) => a + b, 0);
                    return (
                      <tr key={entry.id} className="border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                        <td className="p-3">
                          <input type="checkbox"
                            checked={selectedEntries.has(entry.id)}
                            onChange={() => toggleEntry(entry.id)}
                            className="rounded border-[var(--input-border)]"
                          />
                        </td>
                        <td className="p-3 text-sm text-[var(--text-secondary)] whitespace-nowrap">
                          {entry.weekStartDate ? new Date(entry.weekStartDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.projectColor }} />
                            <span className="text-sm font-medium text-[var(--text-primary)]">{entry.projectName || '—'}</span>
                            {(entry.resubmissionCount || 0) > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" title={`Resubmitted ${entry.resubmissionCount} time(s)`}>
                                <RotateCcw className="w-3 h-3" />
                                Resubmitted
                              </span>
                            )}
                            {entry.rejectionHistory && entry.rejectionHistory.length > 0 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setViewDialog(entry.id); }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors"
                                title="View rejection history"
                              >
                                <History className="w-3 h-3" />
                                {entry.rejectionHistory.length} {entry.rejectionHistory.length === 1 ? 'rejection' : 'rejections'}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-[var(--text-secondary)]">{entry.milestoneName || '—'}</td>
                        {DAYS.map((day) => (
                          <td key={day} className="p-2 text-center text-sm text-[var(--text-primary)]">
                            {entry.hours[day] || '—'}
                          </td>
                        ))}
                        <td className="p-3 text-center">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{entryTotal}h</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 justify-center">
                            <button onClick={() => handleApproveOne(entry.id)}
                              className="p-1.5 rounded-lg text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors"
                              title="Approve">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setRejectDialog(entry.id); setRejectComment(''); }}
                              className="p-1.5 rounded-lg text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                              title="Reject">
                              <XCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => setViewDialog(entry.id)}
                              className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                              title="View details">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Entry</DialogTitle>
            <DialogDescription>Provide a reason for rejection.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            placeholder="Reason for rejection..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Entry Details</DialogTitle>
          </DialogHeader>
          {viewEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[var(--text-tertiary)]">Employee</p>
                  <p className="font-medium text-[var(--text-primary)]">{viewEntry.userName}</p>
                </div>
                <div>
                  <p className="text-[var(--text-tertiary)]">Project</p>
                  <p className="font-medium text-[var(--text-primary)]">{viewEntry.projectName}</p>
                </div>
                <div>
                  <p className="text-[var(--text-tertiary)]">Milestone</p>
                  <p className="font-medium text-[var(--text-primary)]">{viewEntry.milestoneName}</p>
                </div>
                <div>
                  <p className="text-[var(--text-tertiary)]">Billable</p>
                  <p className="font-medium text-[var(--text-primary)]">{viewEntry.billable ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-[var(--text-tertiary)]">Task</p>
                  <p className="font-medium text-[var(--text-primary)]">{viewEntry.taskDescription || '—'}</p>
                </div>
                <div>
                  <p className="text-[var(--text-tertiary)]">Total Hours</p>
                  <p className="font-medium text-[var(--text-primary)]">{viewEntry.totalHours}h</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)] uppercase font-medium mb-2">Daily Hours</p>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map((day, i) => (
                    <div key={day} className="text-center p-2 rounded-lg bg-[var(--bg-tertiary)]">
                      <p className="text-[10px] text-[var(--text-tertiary)] uppercase">{DAY_LABELS[i]}</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{viewEntry.hours[day] || 0}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Current Rejection Reason */}
              {viewEntry.status === 'rejected' && viewEntry.reviewComments && (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
                  <div className="flex items-center gap-2 mb-1">
                    <History className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs font-medium text-red-700 dark:text-red-400">Current Rejection</span>
                    {viewEntry.reviewerName && <span className="text-[10px] text-red-500">by {viewEntry.reviewerName}</span>}
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-300">{viewEntry.reviewComments}</p>
                </div>
              )}
              {/* Past Rejection History */}
              {viewEntry.rejectionHistory && viewEntry.rejectionHistory.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <History className="w-4 h-4 text-amber-500" />
                    <p className="text-xs text-amber-600 dark:text-amber-400 uppercase font-medium">
                      Past Rejection History ({viewEntry.rejectionHistory.length})
                    </p>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {viewEntry.rejectionHistory.map((rh, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-red-700 dark:text-red-400">{rh.reviewerName || 'Manager'}</span>
                          <span className="text-[10px] text-red-500 dark:text-red-400">
                            {rh.rejectedAt ? new Date(rh.rejectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </span>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-300">{rh.comments || 'No remarks provided'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
