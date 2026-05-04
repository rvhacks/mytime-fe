import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, Calendar, DollarSign, Receipt, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PAST_TIMESHEETS, HOURS_PER_PROJECT, WEEKLY_TREND, MONTHLY_OVERVIEW, MONTHLY_BILLABLE, BILLABLE_SUMMARY } from '@/data/mockData';
import { useAdminStore } from '@/store/adminStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

export default function Reports() {
  const { projects } = useAdminStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');

  const filteredTimesheets = useMemo(() => {
    return PAST_TIMESHEETS.filter((ts) => {
      // Date range filter
      if (startDate && ts.weekStartDate < startDate) return false;
      if (endDate && ts.weekEndDate > endDate) return false;

      // Project filter
      if (projectFilter !== 'all') {
        return ts.rows.some((r) => r.projectId === projectFilter);
      }
      return true;
    });
  }, [startDate, endDate, projectFilter]);

  const hasDateFilter = startDate || endDate;

  const clearDateRange = () => {
    setStartDate('');
    setEndDate('');
  };

  // Compute billable hours per past timesheet
  const getTimesheetBillable = (ts: typeof PAST_TIMESHEETS[0]) => {
    const billable = ts.rows
      .filter((r) => r.billable)
      .reduce((sum, r) => sum + Object.values(r.hours).reduce((a, b) => a + b, 0), 0);
    return billable;
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Analyze your timesheet submissions and productivity
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.success('Export started (mock)')}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Billable Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--text-primary)]">{BILLABLE_SUMMARY.totalBillable + BILLABLE_SUMMARY.totalNonBillable}h</p>
              <p className="text-xs text-[var(--text-secondary)]">Total Hours</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-accent-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-accent-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-accent-600 dark:text-accent-400">{BILLABLE_SUMMARY.totalBillable}h</p>
              <p className="text-xs text-[var(--text-secondary)]">Billable Hours</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-50 dark:bg-warning-500/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-warning-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-warning-600 dark:text-warning-400">{BILLABLE_SUMMARY.totalNonBillable}h</p>
              <p className="text-xs text-[var(--text-secondary)]">Non-Billable Hours</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-secondary)]">Billable Rate</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{BILLABLE_SUMMARY.billablePercentage}%</span>
            </div>
            <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-3">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-accent-500 to-accent-400 transition-all duration-700"
                style={{ width: `${BILLABLE_SUMMARY.billablePercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-accent-500">Billable</span>
              <span className="text-[10px] text-warning-500">Non-billable</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--text-tertiary)]" />
              <span className="text-sm font-medium text-[var(--text-secondary)]">Filters:</span>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--text-tertiary)] font-medium">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <label className="text-xs text-[var(--text-tertiary)] font-medium">To</label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              {hasDateFilter && (
                <button
                  onClick={clearDateRange}
                  className="h-9 w-9 flex items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                  title="Clear date range"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Project Filter */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours by Project Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hours Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={HOURS_PER_PROJECT}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {HOURS_PER_PROJECT.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Billable vs Non-Billable */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Billable vs Non-Billable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_BILLABLE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                  <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="billable" fill="#10b981" radius={[4, 4, 0, 0]} name="Billable" stackId="a" />
                  <Bar dataKey="nonBillable" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Non-Billable" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Overview with Billable Line */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Hours Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_OVERVIEW}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="billable" fill="#10b981" radius={[4, 4, 0, 0]} name="Billable" stackId="a" />
                <Bar dataKey="nonBillable" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Non-Billable" stackId="a" />
                <Bar dataKey="expected" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Expected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Past Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-secondary)]">
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Week</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Projects</th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Total</th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">
                    <span className="text-accent-500">Billable</span>
                  </th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">
                    <span className="text-warning-500">Non-Bill.</span>
                  </th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Status</th>
                  <th className="text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filteredTimesheets.map((ts, i) => {
                  const billable = getTimesheetBillable(ts);
                  const nonBillable = ts.totalHours - billable;
                  return (
                    <motion.tr
                      key={ts.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                          <span className="text-sm text-[var(--text-primary)]">
                            {new Date(ts.weekStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(ts.weekEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {ts.rows.map((r) => {
                            const proj = projects.find((p) => p.id === r.projectId);
                            return proj ? (
                              <span
                                key={r.id}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                style={{ backgroundColor: `${proj.color}15`, color: proj.color }}
                              >
                                {proj.code}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{ts.totalHours}h</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-semibold text-accent-600 dark:text-accent-400">{billable}h</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-semibold text-warning-600 dark:text-warning-400">{nonBillable}h</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={ts.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {ts.submittedAt ? new Date(ts.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
