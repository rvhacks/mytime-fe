import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, Calendar, DollarSign, Receipt, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAdminStore } from '@/store/adminStore';
import { useManagementStore } from '@/store/managementStore';
import { useTimesheetStore } from '@/store/timesheetStore';

const HOURS_PER_PROJECT = [
  { name: 'Phoenix Platform', value: 45, color: '#6366f1' },
  { name: 'Atlas CRM', value: 30, color: '#10b981' },
  { name: 'Nexus Analytics', value: 20, color: '#f59e0b' },
  { name: 'Orion Mobile', value: 15, color: '#ef4444' },
];
const WEEKLY_TREND = [
  { name: 'Week 1', hours: 40, expected: 40 },
  { name: 'Week 2', hours: 38, expected: 40 },
  { name: 'Week 3', hours: 32, expected: 40 },
  { name: 'Week 4', hours: 40, expected: 40 },
  { name: 'Week 5', hours: 36, expected: 40 },
];
const MONTHLY_OVERVIEW = [
  { name: 'Jan', hours: 168, expected: 176, billable: 136, nonBillable: 32 },
  { name: 'Feb', hours: 160, expected: 160, billable: 128, nonBillable: 32 },
  { name: 'Mar', hours: 172, expected: 176, billable: 140, nonBillable: 32 },
  { name: 'Apr', hours: 146, expected: 176, billable: 110, nonBillable: 36 },
];
const MONTHLY_BILLABLE = [
  { name: 'Jan', billable: 136, nonBillable: 32 },
  { name: 'Feb', billable: 128, nonBillable: 32 },
  { name: 'Mar', billable: 140, nonBillable: 32 },
  { name: 'Apr', billable: 110, nonBillable: 36 },
];
const BILLABLE_SUMMARY = { totalBillable: 142, totalNonBillable: 44, billablePercentage: 76 };

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
  const { projects, fetchProjects } = useAdminStore();
  const { employees, fetchEmployees } = useManagementStore();
  const { pastTimesheets, fetchTimesheets } = useTimesheetStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
    fetchTimesheets();
  }, []);

  const filteredTimesheets = useMemo(() => {
    return pastTimesheets.filter((ts) => {
      // Date range filter
      if (startDate && ts.weekStartDate < startDate) return false;
      if (endDate && ts.weekEndDate > endDate) return false;
      // Project filter
      if (projectFilter !== 'all') {
        if (!ts.rows.some((r) => r.projectId === projectFilter)) return false;
      }
      // Employee filter (match userId)
      if (employeeFilter !== 'all') {
        // Map employee id to user id pattern
        const emp = employees.find((e) => e.id === employeeFilter);
        if (emp && ts.userId !== emp.id && ts.userId !== `u${emp.id.replace('emp', '')}`) {
          // Simple heuristic: try matching userId
          return false;
        }
      }
      return true;
    });
  }, [startDate, endDate, projectFilter, employeeFilter, employees]);

  const hasDateFilter = startDate || endDate;
  const hasAnyFilter = hasDateFilter || projectFilter !== 'all' || employeeFilter !== 'all';

  const clearDateRange = () => {
    setStartDate('');
    setEndDate('');
  };

  const clearAllFilters = () => {
    setStartDate(''); setEndDate('');
    setProjectFilter('all');
    setEmployeeFilter('all');
  };

  // Compute billable hours per past timesheet
  const getTimesheetBillable = (ts: typeof pastTimesheets[0]) => {
    const billable = ts.rows
      .filter((r) => r.billable)
      .reduce((sum, r) => sum + Object.values(r.hours).reduce((a, b) => a + b, 0), 0);
    return billable;
  };

  // Derived stats from filtered data
  const filteredTotalHours = filteredTimesheets.reduce((sum, ts) => sum + ts.totalHours, 0);
  const filteredBillableHours = filteredTimesheets.reduce((sum, ts) => sum + getTimesheetBillable(ts), 0);
  const filteredNonBillableHours = filteredTotalHours - filteredBillableHours;
  const filteredBillableRate = filteredTotalHours > 0 ? Math.round((filteredBillableHours / filteredTotalHours) * 100) : 0;

  // Derive hours per project from filtered timesheets
  const filteredHoursPerProject = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {};
    filteredTimesheets.forEach((ts) => {
      ts.rows.forEach((r) => {
        const proj = projects.find((p) => p.id === r.projectId);
        if (!proj) return;
        const hours = Object.values(r.hours).reduce((a, b) => a + b, 0);
        if (!map[r.projectId]) {
          map[r.projectId] = { name: proj.name, value: 0, color: proj.color };
        }
        map[r.projectId].value += hours;
      });
    });
    return Object.values(map);
  }, [filteredTimesheets, projects]);

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
              <p className="text-xl font-bold text-[var(--text-primary)]">{filteredTotalHours}h</p>
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
              <p className="text-xl font-bold text-accent-600 dark:text-accent-400">{filteredBillableHours}h</p>
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
              <p className="text-xl font-bold text-warning-600 dark:text-warning-400">{filteredNonBillableHours}h</p>
              <p className="text-xs text-[var(--text-secondary)]">Non-Billable Hours</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-secondary)]">Billable Rate</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{filteredBillableRate}%</span>
            </div>
            <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-3">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-accent-500 to-accent-400 transition-all duration-700"
                style={{ width: `${filteredBillableRate}%` }}
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

            {/* Employee Filter */}
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="all">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>

            {hasAnyFilter && (
              <button
                onClick={clearAllFilters}
                className="h-9 px-3 flex items-center gap-1 rounded-lg text-xs font-medium text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
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
                    data={filteredHoursPerProject.length > 0 ? filteredHoursPerProject : [{ name: 'No data', value: 1, color: '#e2e8f0' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(filteredHoursPerProject.length > 0 ? filteredHoursPerProject : [{ name: 'No data', value: 1, color: '#e2e8f0' }]).map((entry, index) => (
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
