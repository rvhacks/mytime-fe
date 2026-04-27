import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, MessageSquare, Filter, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/States';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { TEAM_HOURS_DATA } from '@/data/mockData';
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

                    {item.status === 'pending' && (
                      <div className="flex items-center gap-2">
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
                      </div>
                    )}
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
    </motion.div>
  );
}
