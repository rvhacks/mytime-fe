import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Link2, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/ui/avatar';
import { useManagementStore } from '@/store/managementStore';
import { useAdminStore } from '@/store/adminStore';
import type { ProjectRole } from '@/types';
import { PROJECT_ROLE_KEYS, PROJECT_ROLES, getRoleLabel } from '@/constants/roles';
import toast, { Toaster } from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const emptyForm = { employeeId: '', projectId: '', role: '' as string };

export default function Assignments() {
  const { employees, assignments, addAssignment, deleteAssignment, fetchEmployees, fetchAssignments, isLoading } = useManagementStore();
  const { projects, fetchProjects } = useAdminStore();

  useEffect(() => { fetchEmployees(); fetchAssignments(); fetchProjects(); }, []);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);

  const updateField = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleAdd = async () => {
    if (!form.employeeId) { toast.error('Select an employee'); return; }
    if (!form.projectId) { toast.error('Select a project'); return; }
    if (!form.role) { toast.error('Select a role'); return; }
    if (assignments.some((a) => a.employeeId === form.employeeId && a.projectId === form.projectId)) {
      toast.error('This employee is already assigned to this project'); return;
    }
    await addAssignment({
      employeeId: form.employeeId,
      projectId: form.projectId,
      role: form.role as ProjectRole,
    });
    setForm(emptyForm); setShowAdd(false);
    toast.success('Employee assigned to project');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteAssignment(deleteId);
    setDeleteId(null);
    toast.success('Assignment removed');
  };

  const getEmpName = (id: string) => {
    const e = employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.lastName}` : id;
  };
  const getProjName = (id: string) => projects.find((x) => x.id === id)?.name || id;

  const filteredAssignments = assignments.filter((a) => {
    const q = search.toLowerCase();
    return getEmpName(a.employeeId).toLowerCase().includes(q) || getProjName(a.projectId).toLowerCase().includes(q);
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Assignments</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Assign employees to projects · {assignments.length} total
          </p>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyForm); setShowAdd(true); }}>
          <Plus className="w-4 h-4" /> Assign Employee
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input type="text" placeholder="Search assignments..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-secondary)]">
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Employee</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Project</th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Role</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Assigned</th>
                  <th className="text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredAssignments.map((a) => (
                    <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Avatar name={getEmpName(a.employeeId)} size="sm" />
                          <span className="text-sm font-medium text-[var(--text-primary)]">{getEmpName(a.employeeId)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">{getProjName(a.projectId)}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400">
                          {a.role}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">
                        {a.assignedAt && a.assignedAt !== 'Invalid ' ? new Date(a.assignedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end">
                          <button onClick={() => setDeleteId(a.id)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filteredAssignments.length === 0 && (
              <div className="text-center py-12">
                <Link2 className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">No assignments found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog — No RM field */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Employee to Project</DialogTitle>
            <DialogDescription>Select an employee, project, and role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee *</Label>
              <select value={form.employeeId} onChange={(e) => updateField('employeeId', e.target.value)}
                className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                <option value="">Select employee</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <Label>Project *</Label>
              <select value={form.projectId} onChange={(e) => updateField('projectId', e.target.value)}
                className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                <option value="">Select project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Role *</Label>
              <select value={form.role} onChange={(e) => updateField('role', e.target.value)}
                className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                <option value="">Select role</option>
                {PROJECT_ROLE_KEYS.map((r) => <option key={r} value={r}>{r} — {getRoleLabel(r)}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} isLoading={isLoading}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Assignment</DialogTitle>
            <DialogDescription>Remove this employee from the project?</DialogDescription>
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
