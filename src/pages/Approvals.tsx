import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, MessageSquare, Filter, Clock, Users, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/States';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

const TEAM_HOURS_DATA = [
  { name: 'Alex J.', hours: 36, status: 'pending' },
  { name: 'Emily D.', hours: 40, status: 'submitted' },
  { name: 'James W.', hours: 38, status: 'submitted' },
  { name: 'Priya S.', hours: 35, status: 'overdue' },
  { name: 'David K.', hours: 42, status: 'submitted' },
];
import toast, { Toaster } from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function Approvals() {
  const { approvals, approveTimesheet, rejectTimesheet } = useAdminStore();
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [viewDialog, setViewDialog] = useState<string | null>(null);

  const { projects, fetchApprovals } = useAdminStore();

  useEffect(() => {
    fetchApprovals();
  }, []);

  const filtered = approvals.filter((a) => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  const handleApprove = async (id: string) => {
    await approveTimesheet(id);
    toast.success('Timesheet approved successfully');
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    await rejectTimesheet(rejectDialog, rejectComment);
    setRejectDialog(null);
    setRejectComment('');
    toast.success('Timesheet rejected');
  };

  const viewItem = viewDialog ? approvals.find((a) => a.id === viewDialog) : null;

  const getProjectName = (projectId: string) => {
    const p = projects.find((proj) => proj.id === projectId);
    return p?.name || projectId;
  };

  const getMilestoneName = (projectId: string, milestoneId: string) => {
    const p = projects.find((proj) => proj.id === projectId);
    const m = p?.milestones.find((ms) => ms.id === milestoneId);
    return m?.name || milestoneId;
  };

  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getRowTotal = (hours: Record<string, number>) =>
    Object.values(hours).reduce((a, b) => a + b, 0);

  const barColors: Record<string, string> = {
    submitted: '#6366f1',
    pending: '#f59e0b',
    overdue: '#ef4444',
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Approvals</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {pendingCount} timesheet{pendingCount !== 1 ? 's' : ''} pending your review
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning-50 dark:bg-warning-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{pendingCount}</p>
              <p className="text-sm text-[var(--text-secondary)]">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-accent-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {approvals.filter((a) => a.status === 'approved').length}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-danger-50 dark:bg-danger-900/20 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-danger-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {approvals.filter((a) => a.status === 'rejected').length}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Hours Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Hours This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TEAM_HOURS_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={11} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]} name="Hours">
                  {TEAM_HOURS_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[entry.status] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-[var(--text-tertiary)]" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Approvals List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No approvals found"
          description="No timesheets match the selected filter"
          action={{ label: 'Show all', onClick: () => setStatusFilter('all') }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar name={item.userName} size="md" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.userName}</h3>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {new Date(item.weekStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(item.weekEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-[var(--text-primary)]">{item.totalHours}h</p>
                        <p className="text-xs text-[var(--text-tertiary)]">Hours</p>
                      </div>
                      <div>
                        <div className="flex flex-wrap gap-1">
                          {item.projects.map((p, j) => (
                            <span key={j} className="text-xs px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewDialog(item.id)}
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      {item.status === 'pending' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApprove(item.id)}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setRejectDialog(item.id)}
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Timesheet</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this timesheet. The employee will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter your comments..."
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectComment.trim()}>
              Reject Timesheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Timesheet Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {viewItem && <Avatar name={viewItem.userName} size="sm" />}
              {viewItem?.userName}'s Timesheet
            </DialogTitle>
            <DialogDescription>
              {viewItem && (
                <span className="flex items-center gap-2">
                  {new Date(viewItem.weekStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(viewItem.weekEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  <span className="mx-1">·</span>
                  {viewItem.totalHours}h total
                  <span className="mx-1">·</span>
                  <StatusBadge status={viewItem.status} />
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {viewItem?.rows && viewItem.rows.length > 0 ? (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-secondary)]">
                    <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 pr-3 w-40">Project</th>
                    <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 pr-3 w-32">Milestone</th>
                    <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 pr-3">Task</th>
                    <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 w-16">Bill.</th>
                    {dayLabels.map((d) => (
                      <th key={d} className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 w-12">{d}</th>
                    ))}
                    <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 w-14">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewItem.rows.map((row) => (
                    <tr key={row.id} className="border-b border-[var(--border-secondary)] last:border-0">
                      <td className="py-3 pr-3">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{getProjectName(row.projectId)}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-sm text-[var(--text-secondary)]">{getMilestoneName(row.projectId, row.milestoneId)}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-sm text-[var(--text-secondary)]">{row.taskDescription}</span>
                      </td>
                      <td className="py-3 text-center">
                        {row.billable ? (
                          <span className="inline-block w-5 h-5 rounded-md bg-accent-500 text-white text-xs leading-5 text-center">✓</span>
                        ) : (
                          <span className="inline-block w-5 h-5 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] text-xs leading-5 text-center">–</span>
                        )}
                      </td>
                      {dayKeys.map((dk) => (
                        <td key={dk} className="py-3 text-center">
                          <span className={`text-sm font-medium ${(row.hours[dk] || 0) > 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                            {row.hours[dk] || 0}
                          </span>
                        </td>
                      ))}
                      <td className="py-3 text-center">
                        <span className="text-sm font-bold text-[var(--text-primary)]">{getRowTotal(row.hours)}h</span>
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-[var(--bg-tertiary)]">
                    <td colSpan={4} className="py-3 pr-3">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">Daily Total</span>
                    </td>
                    {dayKeys.map((dk) => {
                      const dayTotal = viewItem.rows!.reduce((sum, r) => sum + (r.hours[dk] || 0), 0);
                      return (
                        <td key={dk} className="py-3 text-center">
                          <span className={`text-sm font-semibold ${dayTotal > 8 ? 'text-warning-500' : 'text-[var(--text-primary)]'}`}>{dayTotal}h</span>
                        </td>
                      );
                    })}
                    <td className="py-3 text-center">
                      <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{viewItem.totalHours}h</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--text-tertiary)]">
              No detailed timesheet data available.
            </div>
          )}

          <DialogFooter>
            {viewItem?.status === 'pending' && (
              <>
                <Button variant="success" size="sm" onClick={() => { handleApprove(viewItem.id); setViewDialog(null); }}>
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </Button>
                <Button variant="destructive" size="sm" onClick={() => { setViewDialog(null); setRejectDialog(viewItem.id); }}>
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setViewDialog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
