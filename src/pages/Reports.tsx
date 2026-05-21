import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, Clock, CheckCircle2, DollarSign, Receipt, X, FileSpreadsheet, Users, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/shared/Pagination';
import { SearchableDropdown } from '@/components/shared/SearchableDropdown';
import { employeeAPI, projectAPI } from '@/services/api';
import api from '@/services/api';
import toast, { Toaster } from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportRow {
  employeeId: string;
  employeeName: string;
  totalSubmittedHours: number;
  approvedHours: number;
  billableHours: number;
  nonBillableHours: number;
}

interface ReportSummary {
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFirstDayOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function getLastDayOfMonth(): string {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
}

function formatHours(h: number): string {
  return h % 1 === 0 ? String(h) : h.toFixed(1);
}

function getMonthName(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Reports() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState<ReportSummary>({ totalSubmittedHours: 0, approvedHours: 0, billableHours: 0, nonBillableHours: 0 });
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getLastDayOfMonth());
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  // Selection for export
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close export menu on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ---- Fetch Report Data ----
  const fetchReport = useCallback(async (page: number, limit: number) => {
    setLoading(true);
    try {
      const params: any = { page, limit, startDate, endDate };
      if (employeeFilter) params.employeeId = employeeFilter;
      if (projectFilter) params.projectId = projectFilter;

      const res = await api.get('/admin/reports/timesheet-summary', { params });
      const data = res.data.data;

      setRows((data.rows || []).map((r: any) => ({
        employeeId: r.employeeId || r.employee_id || '',
        employeeName: r.employeeName || r.employee_name || '',
        totalSubmittedHours: parseFloat(r.totalSubmittedHours || r.total_submitted_hours || 0),
        approvedHours: parseFloat(r.approvedHours || r.approved_hours || 0),
        billableHours: parseFloat(r.billableHours || r.billable_hours || 0),
        nonBillableHours: parseFloat(r.nonBillableHours || r.non_billable_hours || 0),
      })));
      setSummary(data.summary || { totalSubmittedHours: 0, approvedHours: 0, billableHours: 0, nonBillableHours: 0 });
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, employeeFilter, projectFilter]);

  // ---- Initial + filter-driven load ----
  useEffect(() => {
    fetchReport(1, pagination.limit);
  }, [startDate, endDate, employeeFilter, projectFilter]);

  const handlePageChange = (p: number) => fetchReport(p, pagination.limit);
  const handleLimitChange = (l: number) => fetchReport(1, l);

  // ---- Selection ----
  const toggleSelect = (empId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId); else next.add(empId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.employeeId)));
    }
    setSelectAll(!selectAll);
  };

  useEffect(() => {
    setSelectAll(rows.length > 0 && rows.every((r) => selectedIds.has(r.employeeId)));
  }, [selectedIds, rows]);

  // ---- Export ----
  const handleExport = async (mode: 'all' | 'selected') => {
    setShowExportMenu(false);
    try {
      const params: any = { startDate, endDate };
      if (employeeFilter) params.employeeId = employeeFilter;
      if (projectFilter) params.projectId = projectFilter;
      if (mode === 'selected' && selectedIds.size > 0) {
        params.selectedEmployeeIds = Array.from(selectedIds).join(',');
      }

      const res = await api.get('/admin/reports/timesheet-summary/export', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const fromLabel = startDate.replace(/-/g, '');
      const toLabel = endDate.replace(/-/g, '');
      link.download = `timesheet_report_${fromLabel}_${toLabel}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${mode === 'all' ? 'All' : 'Selected'} employee data exported`);
    } catch {
      toast.error('Export failed');
    }
  };

  // ---- Searchable dropdown data fetchers ----
  const fetchEmpOptions = async (params: { search: string; page: number; limit: number }) => {
    const res = await employeeAPI.getAll({ search: params.search, page: params.page, limit: params.limit, status: 'active' });
    const data = res.data.data;
    return {
      rows: (data?.rows || []).map((u: any) => ({ id: u.id, label: `${u.first_name || u.firstName} ${u.last_name || u.lastName}` })),
      pagination: data?.pagination || { page: 1, totalPages: 1, total: 0 },
    };
  };

  const fetchProjOptions = async (params: { search: string; page: number; limit: number }) => {
    const res = await projectAPI.getAll({ search: params.search, page: params.page, limit: params.limit });
    const data = res.data.data;
    return {
      rows: (data?.rows || []).map((p: any) => ({ id: p.id, label: p.name })),
      pagination: data?.pagination || { page: 1, totalPages: 1, total: 0 },
    };
  };

  // ---- Filter helpers ----
  const hasDateFilter = startDate !== getFirstDayOfMonth() || endDate !== getLastDayOfMonth();
  const hasAnyFilter = hasDateFilter || !!employeeFilter || !!projectFilter;

  const clearAllFilters = () => {
    setStartDate(getFirstDayOfMonth());
    setEndDate(getLastDayOfMonth());
    setEmployeeFilter('');
    setProjectFilter('');
  };

  // ---- Summary cards data ----
  const summaryCards = [
    { label: 'Hours Logged', value: summary.totalSubmittedHours, icon: Clock, color: 'brand', gradient: 'from-brand-500 to-indigo-600' },
    { label: 'Approved Hours', value: summary.approvedHours, icon: CheckCircle2, color: 'emerald', gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Billable Hours', value: summary.billableHours, icon: DollarSign, color: 'accent', gradient: 'from-accent-500 to-violet-600' },
    { label: 'Non-Billable Hours', value: summary.nonBillableHours, icon: Receipt, color: 'amber', gradient: 'from-amber-500 to-orange-600' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {hasDateFilter
              ? `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : `${getMonthName()} · All Employees`}
          </p>
        </div>

        {/* Export Button with Dropdown */}
        <div className="relative" ref={exportRef}>
          <Button
            size="sm"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export
            <ChevronDown className="w-3 h-3" />
          </Button>
          {showExportMenu && (
            <div className="absolute right-0 mt-1 w-56 rounded-xl border border-[var(--border-secondary)] bg-[var(--card-bg)] shadow-xl z-50 py-1">
              <button
                onClick={() => handleExport('all')}
                className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] flex items-center gap-2.5 transition-colors"
              >
                <Users className="w-4 h-4 text-[var(--text-tertiary)]" />
                Export All Employees
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg shadow-${card.color}-500/20`}>
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

            {/* Employee Filter */}
            <div className="w-52">
              <label className="text-[10px] text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-0.5 block">Employee</label>
              <SearchableDropdown
                value={employeeFilter}
                onChange={setEmployeeFilter}
                placeholder="All Employees"
                fetchFn={fetchEmpOptions}
                getOptionValue={(item) => item.id}
                getOptionLabel={(item) => item.label}
              />
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
                  <th className="w-10 p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-[var(--border-secondary)] text-brand-500 focus:ring-brand-500/30 cursor-pointer"
                    />
                  </th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Employee ID</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Employee Name</th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Total Submitted Hours</th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">
                    <span className="text-emerald-500">Approved Hours</span>
                  </th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">
                    <span className="text-accent-500">Billable Hours</span>
                  </th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">
                    <span className="text-amber-500">Non-Billable Hours</span>
                  </th>
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
                        <span className="text-sm font-medium text-[var(--text-secondary)]">No data found</span>
                        <span className="text-xs text-[var(--text-tertiary)]">Try adjusting the date range or filters</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <motion.tr
                      key={row.employeeId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors group"
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.employeeId)}
                          onChange={() => toggleSelect(row.employeeId)}
                          className="w-4 h-4 rounded border-[var(--border-secondary)] text-brand-500 focus:ring-brand-500/30 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono font-medium text-brand-500 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded">
                          {row.employeeId}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{row.employeeName}</span>
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
                    </motion.tr>
                  ))
                )}
              </tbody>
              {/* Footer totals row */}
              {rows.length > 0 && (
                <tfoot className="sticky bottom-0 bg-[var(--card-bg)] border-t-2 border-[var(--border-secondary)]">
                  <tr className="font-semibold">
                    <td className="p-3" />
                    <td className="py-3 px-4" />
                    <td className="py-3 px-4 text-sm text-[var(--text-primary)]">Page Total</td>
                    <td className="py-3 px-4 text-center text-sm text-[var(--text-primary)]">
                      {formatHours(rows.reduce((s, r) => s + r.totalSubmittedHours, 0))}h
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-emerald-600 dark:text-emerald-400">
                      {formatHours(rows.reduce((s, r) => s + r.approvedHours, 0))}h
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-accent-600 dark:text-accent-400">
                      {formatHours(rows.reduce((s, r) => s + r.billableHours, 0))}h
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-amber-600 dark:text-amber-400">
                      {formatHours(rows.reduce((s, r) => s + r.nonBillableHours, 0))}h
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination */}
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
