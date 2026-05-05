import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, FolderOpen, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAdminStore } from '@/store/adminStore';
import { useManagementStore } from '@/store/managementStore';
import toast, { Toaster } from 'react-hot-toast';
import { generateId } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

const emptyForm = {
  projectId: '', name: '', code: '', description: '', startDate: '', endDate: '',
  status: 'active' as 'active' | 'completed' | 'on-hold', color: '#6366f1', rmIds: [] as string[],
};

export default function ManageProjects() {
  const { projects, addProject, updateProject, deleteProject, fetchProjects } = useAdminStore();
  const { employees, fetchEmployees } = useManagementStore();

  useEffect(() => { fetchProjects(); fetchEmployees(); }, []);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())
  );

  const updateField = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const toggleRm = (empId: string) => {
    setForm((f) => ({
      ...f,
      rmIds: f.rmIds.includes(empId) ? f.rmIds.filter((id) => id !== empId) : [...f.rmIds, empId],
    }));
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Project name is required';
    if (!form.code.trim()) return 'Project code is required';
    if (!form.startDate) return 'Start date is required';
    if (!form.endDate) return 'End date is required';
    if (form.startDate > form.endDate) return 'End date must be after start date';
    return null;
  };

  const handleAdd = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    const id = form.projectId.trim() || String(Math.floor(10000000 + Math.random() * 90000000));
    await addProject({
      name: form.name.trim(),
      code: form.code.toUpperCase().trim(),
      color: form.color,
      description: form.description.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      assignedEmployees: [],
      reportingManagers: form.rmIds,
    });
    setForm(emptyForm); setShowAdd(false);
    toast.success('Project created');
  };

  const handleEdit = async () => {
    if (!editId) return;
    const err = validate();
    if (err) { toast.error(err); return; }
    await updateProject(editId, {
      name: form.name.trim(),
      code: form.code.toUpperCase().trim(),
      color: form.color,
      description: form.description.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      reportingManagers: form.rmIds,
    });
    setForm(emptyForm); setEditId(null);
    toast.success('Project updated');
  };

  const openEdit = (id: string) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    setForm({
      projectId: p.id, name: p.name, code: p.code, description: p.description || '',
      startDate: p.startDate || '', endDate: p.endDate || '', status: p.status,
      color: p.color, rmIds: p.reportingManagers || [],
    });
    setEditId(id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteProject(deleteId);
    setDeleteId(null);
    toast.success('Project deleted');
  };

  const formFields = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Project ID <span className="text-[var(--text-tertiary)]">(optional, auto-gen if empty)</span></Label>
          <Input placeholder="Auto-generated" value={form.projectId} onChange={(e) => updateField('projectId', e.target.value)} disabled={!!editId} />
        </div>
        <div>
          <Label>Project Name *</Label>
          <Input placeholder="Phoenix Platform" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
        </div>
        <div>
          <Label>Code *</Label>
          <Input placeholder="PHX" value={form.code} onChange={(e) => updateField('code', e.target.value)} maxLength={6} />
        </div>
        <div>
          <Label>Status *</Label>
          <select
            value={form.status} onChange={(e) => updateField('status', e.target.value)}
            className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <Label>Start Date *</Label>
          <Input type="date" value={form.startDate} onChange={(e) => updateField('startDate', e.target.value)} />
        </div>
        <div>
          <Label>End Date *</Label>
          <Input type="date" value={form.endDate} min={form.startDate || undefined} onChange={(e) => updateField('endDate', e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <textarea
          placeholder="Project description..."
          value={form.description} onChange={(e) => updateField('description', e.target.value)}
          className="w-full min-h-[80px] rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30 placeholder:text-[var(--text-tertiary)] resize-none"
        />
      </div>
      <div>
        <Label>Color</Label>
        <div className="flex items-center gap-2 mt-1">
          {COLORS.map((c) => (
            <button key={c} onClick={() => updateField('color', c)}
              className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div>
        <Label>Reporting Managers (multi-select)</Label>
        <div className="flex flex-wrap gap-2 mt-1 p-3 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] min-h-[44px]">
          {employees.length === 0 && <span className="text-xs text-[var(--text-tertiary)]">No employees available</span>}
          {employees.map((emp) => {
            const selected = form.rmIds.includes(emp.id);
            return (
              <button key={emp.id} onClick={() => toggleRm(emp.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selected
                    ? 'bg-brand-500 text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/80'
                }`}
              >
                {emp.firstName} {emp.lastName}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Projects</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Manage projects · {projects.length} total
          </p>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyForm); setShowAdd(true); }}>
          <Plus className="w-4 h-4" /> Create Project
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          type="text" placeholder="Search projects..."
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
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Project</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Code</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Duration</th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Status</th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">RMs</th>
                  <th className="text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((p) => (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                          <span className="text-sm font-medium text-[var(--text-primary)]">{p.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-mono font-medium" style={{ backgroundColor: `${p.color}15`, color: p.color }}>
                          {p.code}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">
                        {p.startDate ? new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'} – {p.endDate ? new Date(p.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="p-4 text-center"><StatusBadge status={p.status} /></td>
                      <td className="p-4 text-center text-sm text-[var(--text-secondary)]">
                        {(p.reportingManagers || []).length}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(p.id)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">No projects found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Add a new project with details and RM assignment</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} isLoading={useAdminStore.getState().isLoading}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editId} onOpenChange={() => setEditId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
            <Button onClick={handleEdit} isLoading={useAdminStore.getState().isLoading}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>This will permanently delete the project. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
