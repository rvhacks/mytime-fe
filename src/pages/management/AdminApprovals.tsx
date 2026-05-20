import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, Send, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Pagination } from '@/components/shared/Pagination';
import { useAdminStore } from '@/store/adminStore';
import { adminApprovalAPI } from '@/services/api';
import type { ManagerApprovalSummary } from '@/types';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminApprovals() {
  const { managerApprovals, fetchManagerApprovals, sendReminders, isLoading } = useAdminStore();
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [expandedManager, setExpandedManager] = useState<string | null>(null);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => { fetchManagerApprovals(); }, []);

  const toggleManager = (id: string) => {
    setSelectedManagers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedManagers.length === managerApprovals.length) {
      setSelectedManagers([]);
    } else {
      setSelectedManagers(managerApprovals.map((m) => m.id));
    }
  };

  const handleSendReminders = async () => {
    if (selectedManagers.length === 0) {
      toast.error('Select at least one manager');
      return;
    }
    await sendReminders(selectedManagers);
    toast.success(`Reminders sent to ${selectedManagers.length} manager(s)`);
    setSelectedManagers([]);
  };

  const handleDrillDown = async (managerId: string) => {
    if (expandedManager === managerId) {
      setExpandedManager(null);
      setDrillDownData(null);
      return;
    }
    setExpandedManager(managerId);
    setDrillLoading(true);
    try {
      const res = await adminApprovalAPI.getManagerEntries(managerId);
      setDrillDownData(res.data.data);
    } catch {
      toast.error('Failed to load details');
      setDrillDownData(null);
    }
    setDrillLoading(false);
  };

  const totalPending = managerApprovals.reduce((sum, m) => sum + m.pendingCount, 0);
  const totalPages = Math.ceil(managerApprovals.length / limit);
  const paginatedManagers = managerApprovals.slice((page - 1) * limit, page * limit);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Approval Tracker</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Monitor manager approval performance · {managerApprovals.length} managers
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleSendReminders}
          disabled={selectedManagers.length === 0 || isLoading}
        >
          <Send className="w-4 h-4" /> Send Reminders ({selectedManagers.length})
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{managerApprovals.length}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Active Managers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{totalPending}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Total Pending Approvals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {managerApprovals.filter((m) => m.pendingCount > 5).length}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">Managers with 5+ Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manager Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)]">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-[var(--card-bg)]">
                <tr className="border-b border-[var(--border-secondary)]">
                  <th className="text-left p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedManagers.length === managerApprovals.length && managerApprovals.length > 0}
                      onChange={toggleAll}
                      className="rounded border-[var(--input-border)] accent-brand-500"
                    />
                  </th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Manager</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Emp ID</th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Direct Reports</th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Pending</th>
                  <th className="text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {paginatedManagers.map((m) => (
                  <>
                    <tr key={m.id} className="border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedManagers.includes(m.id)}
                          onChange={() => toggleManager(m.id)}
                          className="rounded border-[var(--input-border)] accent-brand-500"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={`${m.firstName} ${m.lastName}`} size="sm" />
                          <div>
                            <span className="text-sm font-medium text-[var(--text-primary)]">{m.firstName} {m.lastName}</span>
                            <p className="text-xs text-[var(--text-tertiary)]">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-brand-600 dark:text-brand-400 font-mono">{m.employeeId || '—'}</td>
                      <td className="p-4 text-center text-sm text-[var(--text-secondary)]">{m.totalDirectReports}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          m.pendingCount > 5
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            : m.pendingCount > 0
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                        }`}>
                          {m.pendingCount}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDrillDown(m.id)}
                          className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                          title="View Details"
                        >
                          {expandedManager === m.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                    {expandedManager === m.id && (
                      <tr key={`${m.id}-detail`}>
                        <td colSpan={6} className="bg-[var(--bg-tertiary)] p-4">
                          {drillLoading ? (
                            <div className="text-center py-4 text-sm text-[var(--text-tertiary)]">Loading...</div>
                          ) : drillDownData ? (
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Direct Reports</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {(drillDownData.directReports || []).map((dr: any) => (
                                  <div key={dr.id} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-secondary)]">
                                    <Avatar name={`${dr.first_name || dr.firstName} ${dr.last_name || dr.lastName}`} size="sm" />
                                    <div>
                                      <p className="text-sm font-medium text-[var(--text-primary)]">{dr.first_name || dr.firstName} {dr.last_name || dr.lastName}</p>
                                      <p className="text-xs text-[var(--text-tertiary)]">{dr.employee_id || dr.employeeId || '—'}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {(drillDownData.entries || []).length > 0 && (
                                <>
                                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mt-4">Recent Timesheet Entries</h4>
                                  <div className="text-xs text-[var(--text-tertiary)]">
                                    {drillDownData.entries.length} entries found
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-sm text-[var(--text-tertiary)]">No data available</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            {managerApprovals.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">No managers found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={managerApprovals.length}
          itemsPerPage={limit}
        />
      )}
    </motion.div>
  );
}
