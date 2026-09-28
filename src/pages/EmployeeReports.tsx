import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, Clock, CheckCircle2, AlertCircle, DollarSign, Receipt, X, FileSpreadsheet, ChevronDown, Download, Users as UsersIcon, Eye } from 'lucide-react';
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

interface TeamReportRow {
  employeeId: string;
  employeeName: string;
  totalSubmittedHours: number;
  approvedHours: number;
  unapprovedHours: number;
  billableHours: number;
  nonBillableHours: number;
}

interface TeamReportSummary {
  totalSubmittedHours: number;
  approvedHours: number;
  unapprovedHours: number;
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

// Local Y/M/D — deliberately not `.toISOString()`, which converts to UTC first and can land on
// the wrong calendar day on a server/browser whose local timezone is ahead of UTC.
function getFirstDayOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function getLastDayOfMonth(): string {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
}

export default function EmployeeReports() {
  const { user } = useAuthStore();
  const isManager = user?.isManager;
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Toaster position="top-right" />
      {isManager ? <TeamReportView /> : <MyReportView navigate={navigate} />}
    </motion.div>
  );
}

// ===========================================================================
// Manager view: same shape as the admin Employee Summary report, scoped to
// this manager's direct reports only — multi-select Employee + Project filters,
// same summary cards, same table, same Export (All/Selected).
// ===========================================================================

function TeamReportView() {
  const { user } = useAuthStore();
  const [rows, setRows] = useState<TeamReportRow[]>([]);
  const [summary, setSummary] = useState<TeamReportSummary>({ totalSubmittedHours: 0, approvedHours: 0, unapprovedHours: 0, billableHours: 0, nonBillableHours: 0 });
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getLastDayOfMonth());
  const [employeeFilter, setEmployeeFilter] = useState<string[]>([]);
  const [projectFilter, setProjectFilter] = useState<string[]>([]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Direct reports, fetched once — used for client-side filtering of the Employee dropdown
  // (a manager's team is small enough that server-side pagination isn't needed here).
  const [directReports, setDirectReports] = useState<any[]>([]);
  useEffect(() => {
    userAPI.getMyTeam().then((res) => {
      const members = (res.data.data?.members || []).filter((m: any) => m.isDirectReport);
      setDirectReports(members);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchReport = useCallback(async (page: number, limit: number) => {
    setLoading(true);
    try {
      const params: any = { page, limit, startDate, endDate };
      if (employeeFilter.length > 0) params.employeeId = employeeFilter.join(',');
      if (projectFilter.length > 0) params.projectId = projectFilter.join(',');

      const res = await userAPI.getTeamReport(params);
      const data = res.data.data;
      setRows(data.rows || []);
      setSummary(data.summary || { totalSubmittedHours: 0, approvedHours: 0, unapprovedHours: 0, billableHours: 0, nonBillableHours: 0 });
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load team report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, employeeFilter, projectFilter]);

  useEffect(() => {
    fetchReport(1, pagination.limit);
  }, [startDate, endDate, employeeFilter, projectFilter]);

  const handlePageChange = (p: number) => fetchReport(p, pagination.limit);
  const handleLimitChange = (l: number) => fetchReport(1, l);

  const toggleSelect = (empId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId); else next.add(empId);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectAll) setSelectedIds(new Set());
    else setSelectedIds(new Set(rows.map((r) => r.employeeId)));
    setSelectAll(!selectAll);
  };
  useEffect(() => {
    setSelectAll(rows.length > 0 && rows.every((r) => selectedIds.has(r.employeeId)));
  }, [selectedIds, rows]);

  const handleExport = async (mode: 'all' | 'selected') => {
    setShowExportMenu(false);
    try {
      const params: any = { startDate, endDate };
      if (employeeFilter.length > 0) params.employeeId = employeeFilter.join(',');
      if (projectFilter.length > 0) params.projectId = projectFilter.join(',');
      if (mode === 'selected' && selectedIds.size > 0) {
        params.selectedEmployeeIds = Array.from(selectedIds).join(',');
      }

      const res = await userAPI.exportTeamReport(params);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const fromLabel = startDate.replace(/-/g, '');
      const toLabel = endDate.replace(/-/g, '');
      link.download = `team_timesheet_report_${fromLabel}_${toLabel}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${mode === 'all' ? 'All' : 'Selected'} employee data exported`);
    } catch {
      toast.error('Export failed');
    }
  };

  // Employee dropdown — the manager themselves, plus their (small) direct-reports list,
  // client-side filtered. The report itself already includes the manager's own hours; this
  // just lets them narrow down to "just me" or "just my team" the same way.
  const employeeOptions = useMemo(() => {
    const self = user ? [{ id: user.id, name: `${user.name} (You)` }] : [];
    return [...self, ...directReports];
  }, [user, directReports]);
  const fetchEmpOptions = async (params: { search: string; page: number; limit: number }) => {
    const filtered = params.search
      ? employeeOptions.filter((m: any) => m.name.toLowerCase().includes(params.search.toLowerCase()))
      : employeeOptions;
    return {
      rows: filtered.map((m: any) => ({ id: m.id, label: m.name })),
      pagination: { page: 1, totalPages: 1, total: filtered.length },
    };
  };

  // Project dropdown — projects assigned to the manager or their direct reports
  const [teamProjects, setTeamProjects] = useState<any[]>([]);
  useEffect(() => {
    timesheetAPI.getAssignedProjects().then((res) => setTeamProjects(res.data.data || [])).catch(() => {});
  }, []);
  const fetchProjOptions = async (params: { search: string; page: number; limit: number }) => {
    const filtered = params.search
      ? teamProjects.filter((p: any) => (p.name || '').toLowerCase().includes(params.search.toLowerCase()))
      : teamProjects;
    return {
      rows: filtered.map((p: any) => ({ id: p.id, label: p.name })),
      pagination: { page: 1, totalPages: 1, total: filtered.length },
    };
  };

  const hasDateFilter = startDate !== getFirstDayOfMonth() || endDate !== getLastDayOfMonth();
  const hasAnyFilter = hasDateFilter || employeeFilter.length > 0 || projectFilter.length > 0;
  const clearAllFilters = () => {
    setStartDate(getFirstDayOfMonth());
    setEndDate(getLastDayOfMonth());
    setEmployeeFilter([]);
    setProjectFilter([]);
  };

  const summaryCards = [
    { label: 'Hours Logged', value: summary.totalSubmittedHours, icon: Clock, gradient: 'from-brand-500 to-indigo-600' },
    { label: 'Approved Hours', value: summary.approvedHours, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Billable Hours', value: summary.billableHours, icon: DollarSign, gradient: 'from-accent-500 to-violet-600' },
    { label: 'Non-Billable Hours', value: summary.nonBillableHours, icon: Receipt, gradient: 'from-amber-500 to-orange-600' },
    { label: 'Unapproved Hours', value: summary.unapprovedHours, icon: AlertCircle, gradient: 'from-red-500 to-rose-600' },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Your team's timesheet summary</p>
        </div>
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-500/25 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export
            <ChevronDown className="w-3 h-3" />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-1 w-56 rounded-xl border border-[var(--border-secondary)] bg-[var(--card-bg)] shadow-xl z-50 py-1">
              <button
                onClick={() => handleExport('all')}
                className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] flex items-center gap-2.5 transition-colors"
              >
                <UsersIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                Export All (Your Team)
              </button>
              <button
                onClick={() => handleExport('selected')}
                disabled={selectedIds.size === 0}
                className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] flex items-center gap-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 text-[var(--text-tertiary)]" />
                Export Selected ({selectedIds.size})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryCards.map((card, i) => {
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

            <div className="flex items-center gap-2">
              <div>
                <label className="text-[10px] text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-0.5 block">From</label>
                <input
                  type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-0.5 block">To</label>
                <input
                  type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            <div className="w-52">
              <label className="text-[10px] text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-0.5 block">Employee</label>
              <SearchableDropdown
                multiple
                values={employeeFilter}
                onChangeValues={setEmployeeFilter}
                placeholder="All Team Members"
                fetchFn={fetchEmpOptions}
                getOptionValue={(item) => item.id}
                getOptionLabel={(item) => item.label}
              />
            </div>

            <div className="w-52">
              <label className="text-[10px] text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-0.5 block">Project</label>
              <SearchableDropdown
                multiple
                values={projectFilter}
                onChangeValues={setProjectFilter}
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] rounded-xl">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-[var(--card-bg)]">
                <tr className="border-b border-[var(--border-secondary)]">
                  <th className="w-10 p-3 text-center">
                    <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="w-4 h-4 rounded border-[var(--border-secondary)] text-brand-500 focus:ring-brand-500/30 cursor-pointer" />
                  </th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Employee ID</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Employee Name</th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Total Submitted Hours</th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4"><span className="text-emerald-500">Approved Hours</span></th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4"><span className="text-accent-500">Billable Hours</span></th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4"><span className="text-amber-500">Non-Billable Hours</span></th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4"><span className="text-red-500">Unapproved Hours</span></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-[var(--text-secondary)]">Loading report...</span>
                    </div>
                  </td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileSpreadsheet className="w-10 h-10 text-[var(--text-tertiary)]" />
                      <span className="text-sm font-medium text-[var(--text-secondary)]">No data found</span>
                      <span className="text-xs text-[var(--text-tertiary)]">Try adjusting the date range or filters</span>
                    </div>
                  </td></tr>
                ) : (
                  rows.map((row, i) => (
                    <motion.tr key={row.employeeId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <td className="p-3 text-center">
                        <input type="checkbox" checked={selectedIds.has(row.employeeId)} onChange={() => toggleSelect(row.employeeId)} className="w-4 h-4 rounded border-[var(--border-secondary)] text-brand-500 focus:ring-brand-500/30 cursor-pointer" />
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono font-medium text-brand-500 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded">{row.employeeId}</span>
                      </td>
                      <td className="py-3 px-4"><span className="text-sm font-medium text-[var(--text-primary)]">{row.employeeName}</span></td>
                      <td className="py-3 px-4 text-center"><span className="text-sm font-semibold text-[var(--text-primary)]">{formatHours(row.totalSubmittedHours)}h</span></td>
                      <td className="py-3 px-4 text-center"><span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatHours(row.approvedHours)}h</span></td>
                      <td className="py-3 px-4 text-center"><span className="text-sm font-semibold text-accent-600 dark:text-accent-400">{formatHours(row.billableHours)}h</span></td>
                      <td className="py-3 px-4 text-center"><span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{formatHours(row.nonBillableHours)}h</span></td>
                      <td className="py-3 px-4 text-center"><span className="text-sm font-semibold text-red-600 dark:text-red-400">{formatHours(row.unapprovedHours)}h</span></td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 0 && (
            <div className="border-t border-[var(--border-secondary)] p-3">
              <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit} onPageChange={handlePageChange} onLimitChange={handleLimitChange} />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ===========================================================================
// Non-manager view: unchanged per-week self report — Project filter is now multi-select.
// ===========================================================================

function MyReportView({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [projectFilter, setProjectFilter] = useState<string[]>([]);

  const fetchReport = useCallback(async (page: number, limit: number) => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (projectFilter.length > 0) params.projectId = projectFilter.join(',');

      const res = await userAPI.getMyReport(params);
      const data = res.data.data;
      setRows(data.rows || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, projectFilter]);

  useEffect(() => {
    fetchReport(1, pagination.limit);
  }, [startDate, endDate, projectFilter]);

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

  const hasAnyFilter = !!startDate || !!endDate || projectFilter.length > 0;
  const clearAllFilters = () => { setStartDate(''); setEndDate(''); setProjectFilter([]); };

  // Summary computed from current page (for display)
  const pageSummary = useMemo(() => {
    return rows.reduce((acc, r) => ({
      submitted: acc.submitted + r.totalSubmittedHours,
      approved: acc.approved + r.approvedHours,
      billable: acc.billable + r.billableHours,
      nonBillable: acc.nonBillable + r.nonBillableHours,
    }), { submitted: 0, approved: 0, billable: 0, nonBillable: 0 });
  }, [rows]);

  return (
    <>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">My past submitted timesheets</p>
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
                multiple
                values={projectFilter}
                onChangeValues={setProjectFilter}
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
    </>
  );
}
