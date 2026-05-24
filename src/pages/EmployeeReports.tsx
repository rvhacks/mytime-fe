import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, Clock, CheckCircle2, DollarSign, Receipt, X, FileSpreadsheet, ChevronDown, Users as UsersIcon, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/shared/Pagination';
import { SearchableDropdown } from '@/components/shared/SearchableDropdown';
import { userAPI, timesheetAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import toast, { Toaster } from 'react-hot-toast';

interface ReportRow {
  timesheetId: string;
  weekStartDate: string;
  weekEndDate: string;
  projects: string[];
  totalSubmittedHours: number;
  approvedHours: number;
  billableHours: number;
  nonBillableHours: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function formatHours(h: number): string {
  return h % 1 === 0 ? String(h) : h.toFixed(1);
}

function normalizeDate(d: string): string {
  // Extract just YYYY-MM-DD from any date format (handles timestamps like 2026-05-18T18:30:00.000Z)
  return d ? d.slice(0, 10) : d;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(normalizeDate(start) + 'T00:00:00');
  const e = new Date(normalizeDate(end) + 'T00:00:00');
  return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export default function EmployeeReports() {
  const { user } = useAuthStore();
  const isManager = user?.isManager;
  const navigate = useNavigate();

  const [rows, setRows] = useState<ReportRow[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  // For RM: view direct report's data
  const [directReports, setDirectReports] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState(''); // empty = self

  useEffect(() => {
    if (isManager) {
      userAPI.getMyTeam().then((res) => {
        const members = (res.data.data?.members || []).filter((m: any) => m.isDirectReport);
        setDirectReports(members);
      }).catch(() => {});
    }
  }, [isManager]);

  const fetchReport = useCallback(async (page: number, limit: number) => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (projectFilter) params.projectId = projectFilter;
      if (selectedEmployee) params.targetUserId = selectedEmployee;

      const res = await userAPI.getMyReport(params);
      const data = res.data.data;
      setRows(data.rows || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, projectFilter, selectedEmployee]);

  useEffect(() => {
    fetchReport(1, pagination.limit);
  }, [startDate, endDate, projectFilter, selectedEmployee]);

  const handlePageChange = (p: number) => fetchReport(p, pagination.limit);
  const handleLimitChange = (l: number) => fetchReport(1, l);

  const fetchProjOptions = async (params: { search: string; page: number; limit: number }) => {
    const res = await timesheetAPI.getAssignedProjects();
    const projects = res.data.data || [];
    const filtered = params.search
      ? projects.filter((p: any) => p.name.toLowerCase().includes(params.search.toLowerCase()))
      : projects;
    return {
      rows: filtered.map((p: any) => ({ id: p.id, label: p.name })),
      pagination: { page: 1, totalPages: 1, total: filtered.length },
    };
  };

  const hasAnyFilter = !!startDate || !!endDate || !!projectFilter;
  const clearAllFilters = () => { setStartDate(''); setEndDate(''); setProjectFilter(''); };

  // Summary computed from current page (for display)
  const pageSummary = useMemo(() => {
    return rows.reduce((acc, r) => ({
      submitted: acc.submitted + r.totalSubmittedHours,
      approved: acc.approved + r.approvedHours,
      billable: acc.billable + r.billableHours,
      nonBillable: acc.nonBillable + r.nonBillableHours,
    }), { submitted: 0, approved: 0, billable: 0, nonBillable: 0 });
  }, [rows]);

  const selectedEmpName = useMemo(() => {
    if (!selectedEmployee) return 'My';
    const emp = directReports.find(d => d.id === selectedEmployee);
    return emp ? `${emp.firstName}'s` : 'Employee';
  }, [selectedEmployee, directReports]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          {selectedEmpName} past submitted timesheets
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Submitted Hours', value: pageSummary.submitted, icon: Clock, gradient: 'from-brand-500 to-indigo-600' },
          { label: 'Approved Hours', value: pageSummary.approved, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600' },
          { label: 'Billable Hours', value: pageSummary.billable, icon: DollarSign, gradient: 'from-accent-500 to-violet-600' },
          { label: 'Non-Billable Hours', value: pageSummary.nonBillable, icon: Receipt, gradient: 'from-amber-500 to-orange-600' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="overflow-hidden">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{formatHours(card.value)}h</p>
                    <p className="text-xs text-[var(--text-secondary)] font-medium">{card.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-4 h-4 text-[var(--text-tertiary)]" />
              <span className="text-sm font-medium text-[var(--text-secondary)]">Filters:</span>
            </div>

            {/* RM: Employee selector */}
            {isManager && directReports.length > 0 && (
              <div className="w-52">
                <label className="text-[10px] text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-0.5 block">Employee</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value="">My Timesheets</option>
                  {directReports.map((d) => (
                    <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <div>
                <label className="text-[10px] text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-0.5 block">From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-0.5 block">To</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            {/* Project Filter */}
            <div className="w-52">
              <label className="text-[10px] text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-0.5 block">Project</label>
              <SearchableDropdown
                value={projectFilter}
                onChange={setProjectFilter}
                placeholder="All Projects"
                fetchFn={fetchProjOptions}
                getOptionValue={(item) => item.id}
                getOptionLabel={(item) => item.label}
              />
            </div>

            {hasAnyFilter && (
              <button
                onClick={clearAllFilters}
                className="h-9 px-3 flex items-center gap-1 rounded-lg text-xs font-medium text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors self-end"
              >
                <X className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] rounded-xl">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-[var(--card-bg)]">
                <tr className="border-b border-[var(--border-secondary)]">
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Date Range</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Projects</th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Total Hours Submitted</th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">
                    <span className="text-emerald-500">Approved Hours</span>
                  </th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">
                    <span className="text-accent-500">Billable Hours</span>
                  </th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">
                    <span className="text-amber-500">Non-Billable Hours</span>
                  </th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-[var(--text-secondary)]">Loading report...</span>
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileSpreadsheet className="w-10 h-10 text-[var(--text-tertiary)]" />
                        <span className="text-sm font-medium text-[var(--text-secondary)]">No timesheets found</span>
                        <span className="text-xs text-[var(--text-tertiary)]">Submitted timesheets will appear here</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <motion.tr
                      key={row.timesheetId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm text-[var(--text-primary)] font-medium">
                          {formatDateRange(row.weekStartDate, row.weekEndDate)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {row.projects.map((p, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{formatHours(row.totalSubmittedHours)}h</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatHours(row.approvedHours)}h</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-semibold text-accent-600 dark:text-accent-400">{formatHours(row.billableHours)}h</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{formatHours(row.nonBillableHours)}h</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => navigate(`/timesheet?weekStart=${normalizeDate(row.weekStartDate)}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
                          title="View this week's timesheet"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 0 && (
            <div className="border-t border-[var(--border-secondary)] p-3">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
