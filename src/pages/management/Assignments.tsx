import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, Link2, Search, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/ui/avatar';
import { Pagination } from '@/components/shared/Pagination';
import { SearchableDropdown } from '@/components/shared/SearchableDropdown';
import { useManagementStore } from '@/store/managementStore';
import { useAdminStore } from '@/store/adminStore';
import { employeeAPI, projectAPI } from '@/services/api';
import type { ProjectRole } from '@/types';
import { PROJECT_ROLE_KEYS, getRoleLabel } from '@/constants/roles';
import toast, { Toaster } from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const emptyForm = { employeeId: '', projectId: '', role: '' as string };

export default function Assignments() {
  const { employees, assignments, addAssignment, deleteAssignment, fetchEmployees, fetchAssignments, isLoading, assignmentPagination } = useManagementStore();
  const { projects, fetchProjects } = useAdminStore();

  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filterEmpId, setFilterEmpId] = useState<string>('');
  const [filterProjId, setFilterProjId] = useState<string>('');

  // Pre-populate project filter from URL query
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const pid = searchParams.get('projectId');
    if (pid) setFilterProjId(pid);
  }, [searchParams]);

  const loadPage = useCallback((p: number, l: number) => {
    fetchAssignments({ page: p, limit: l });
  }, [fetchAssignments]);

  useEffect(() => {
    loadPage(1, limit);
    fetchEmployees({ limit: 100 });
    fetchProjects({ limit: 100 });
  }, []);
  useEffect(() => { loadPage(page, limit); }, [page, limit]);

  const updateField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleAdd = async () => {
    if (!form.employeeId) { toast.error('Select an employee'); return; }
    if (!form.projectId) { toast.error('Select a project'); return; }
    if (!form.role) { toast.error('Select a role'); return; }
    await addAssignment({
      employeeId: form.employeeId,
      projectId: form.projectId,
      role: form.role as ProjectRole,
    });
    setForm(emptyForm); setShowAdd(false);
    toast.success('Employee assigned to project');
    loadPage(page, limit);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteAssignment(deleteId);
    setDeleteId(null);
    toast.success('Assignment removed');
    loadPage(page, limit);
  };

  const getEmpName = (id: string) => {
    const e = employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.lastName}` : id;
  };
  const getProjName = (id: string) => projects.find((x) => x.id === id)?.name || id;

  const filteredAssignments = assignments.filter((a) => {
    if (filterEmpId && a.employeeId !== filterEmpId) return false;
    if (filterProjId && a.projectId !== filterProjId) return false;
    if (search) {
      const q = search.toLowerCase();
      return getEmpName(a.employeeId).toLowerCase().includes(q) || getProjName(a.projectId).toLowerCase().includes(q);
    }
    return true;
  });

  // Paginated search for employee dropdown
  const fetchEmpOptions = async (params: { search: string; page: number; limit: number }) => {
    const res = await employeeAPI.getAll({ search: params.search, page: params.page, limit: params.limit, status: 'active' });
    const data = res.data.data;
    return {
      rows: (data?.rows || []).map((u: any) => ({ id: u.id, label: `${u.first_name || u.firstName} ${u.last_name || u.lastName}` })),
      pagination: data?.pagination || { page: 1, totalPages: 1, total: 0 },
    };
  };

  // Paginated search for project dropdown
  const fetchProjOptions = async (params: { search: string; page: number; limit: number }) => {
    const res = await projectAPI.getAll({ search: params.search, page: params.page, limit: params.limit });
    const data = res.data.data;
    return {
      rows: (data?.rows || []).map((p: any) => ({ id: p.id, label: `${p.name} (${p.project_code || p.code})` })),
      pagination: data?.pagination || { page: 1, totalPages: 1, total: 0 },
    };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Assignments</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Assign employees to projects · {assignmentPagination.total} total
          </p>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyForm); setShowAdd(true); }}>
          <Plus className="w-4 h-4" /> Assign Employee
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text" placeholder="Search assignments..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
          <div className="w-52">
            <SearchableDropdown
              value={filterEmpId}
              onChange={(val) => setFilterEmpId(val)}
              placeholder="Filter by employee..."
              fetchFn={fetchEmpOptions}
              getOptionValue={(item) => item.id}
              getOptionLabel={(item) => item.label}
            />
          </div>
          <div className="w-52">
            <SearchableDropdown
              value={filterProjId}
              onChange={(val) => setFilterProjId(val)}
              placeholder="Filter by project..."
              fetchFn={fetchProjOptions}
              getOptionValue={(item) => item.id}
              getOptionLabel={(item) => item.label}
            />
          </div>
          {(filterEmpId || filterProjId) && (
            <button
              onClick={() => { setFilterEmpId(''); setFilterProjId(''); }}
              className="text-xs text-brand-500 hover:underline whitespace-nowrap"
            >Clear filters</button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] rounded-xl">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-[var(--card-bg)]">
                <tr className="border-b border-[var(--border-secondary)]">
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Employee</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Project</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Role</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Assigned</th>
                  <th className="text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={getEmpName(a.employeeId)} size="sm" />
                        <span className="text-sm font-medium text-[var(--text-primary)]">{getEmpName(a.employeeId)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">{getProjName(a.projectId)}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">
                        {getRoleLabel(a.role as ProjectRole)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">
                      {a.assignedAt ? new Date(a.assignedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setDeleteId(a.id)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Remove">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAssignments.length === 0 && (
              <div className="text-center py-12">
                <Link2 className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">No assignments found</p>
              </div>
            )}
          </div>
          <Pagination
            page={assignmentPagination.page}
            totalPages={assignmentPagination.totalPages}
            total={assignmentPagination.total}
            limit={limit}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Employee to Project</DialogTitle>
            <DialogDescription>Select employee, project, and role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee *</Label>
              <SearchableDropdown
                value={form.employeeId}
                onChange={(val) => updateField('employeeId', val)}
                fetchFn={fetchEmpOptions}
                getOptionValue={(item) => item.id}
                getOptionLabel={(item) => item.label}
                placeholder="Search employee..."
              />
            </div>
            <div>
              <Label>Project *</Label>
              <SearchableDropdown
                value={form.projectId}
                onChange={(val) => updateField('projectId', val)}
                fetchFn={fetchProjOptions}
                getOptionValue={(item) => item.id}
                getOptionLabel={(item) => item.label}
                placeholder="Search project..."
              />
            </div>
            <div>
              <Label>Role *</Label>
              <select
                value={form.role} onChange={(e) => updateField('role', e.target.value)}
                className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="">Select role</option>
                {PROJECT_ROLE_KEYS.map((r) => (
                  <option key={r} value={r}>{getRoleLabel(r)}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} isLoading={isLoading}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Assignment</DialogTitle>
            <DialogDescription>This will remove the employee from the project.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={isLoading}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
