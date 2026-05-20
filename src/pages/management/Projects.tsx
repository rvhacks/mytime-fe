import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit3, Trash2, FolderKanban, Search, Filter, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/shared/Pagination';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { useAdminStore } from '@/store/adminStore';
import toast, { Toaster } from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const emptyForm = {
  name: '', code: '', description: '', startDate: '', endDate: '', status: 'active',
  color: '#6366f1', partnerProjectId: '',
};

export default function Projects() {
  const { projects, addProject, updateProject, deleteProject, fetchProjects, isLoading, projectPagination } = useAdminStore();

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadPage = useCallback((p: number, l: number, s?: string, status?: string) => {
    fetchProjects({ page: p, limit: l, search: s || search || undefined, status: status || statusFilter });
  }, [fetchProjects, search, statusFilter]);

  useEffect(() => { loadPage(1, limit); }, []);
  useEffect(() => { loadPage(page, limit); }, [page, limit]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadPage(1, limit, search, statusFilter); }, 300);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  const updateField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Name is required';
    if (!form.code.trim()) return 'Code is required';
    if (!form.startDate) return 'Start date is required';
    if (!form.endDate) return 'End date is required';
    return null;
  };

  const handleAdd = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    await addProject({
      name: form.name.trim(), code: form.code.trim().toUpperCase(),
      description: form.description.trim(), color: form.color,
      partnerProjectId: form.partnerProjectId.trim() || undefined,
      startDate: form.startDate, endDate: form.endDate, status: form.status,
    });
    setForm(emptyForm); setShowAdd(false);
    toast.success('Project created');
  };

  const handleEdit = async () => {
    if (!editId) return;
    const err = validate();
    if (err) { toast.error(err); return; }
    await updateProject(editId, {
      name: form.name.trim(), description: form.description.trim(),
      color: form.color, partnerProjectId: form.partnerProjectId.trim() || undefined,
      startDate: form.startDate, endDate: form.endDate, status: form.status,
    });
    setForm(emptyForm); setEditId(null);
    toast.success('Project updated');
  };

  const openEdit = (id: string) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    setForm({
      name: p.name, code: p.code, description: p.description || '',
      startDate: p.startDate || '', endDate: p.endDate || '', status: p.status,
      color: p.color, partnerProjectId: p.partnerProjectId || '',
    });
    setEditId(id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteProject(deleteId);
    setDeleteId(null);
    toast.success('Project archived');
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'active': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
      'on-hold': 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
      'completed': 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </span>
    );
  };

  const formFields = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {!editId && (
          <div className="sm:col-span-2">
            <Label>Project ID <span className="text-[var(--text-tertiary)]">(auto-generated)</span></Label>
            <div className="h-10 px-3 rounded-xl border border-dashed border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-900/10 flex items-center">
              <span className="text-sm text-brand-600 dark:text-brand-400 font-mono">Will be auto-generated on create (e.g., CT-260001)</span>
            </div>
          </div>
        )}
        <div>
          <Label>Project Name *</Label>
          <Input placeholder="Phoenix Platform" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
        </div>
        <div>
          <Label>Code * <span className="text-[var(--text-tertiary)]">(3-char short code)</span></Label>
          <Input placeholder="PHX" value={form.code} onChange={(e) => updateField('code', e.target.value.toUpperCase())} maxLength={6} disabled={!!editId} />
        </div>
        <div>
          <Label>Partner Project ID <span className="text-[var(--text-tertiary)]">(optional)</span></Label>
          <Input placeholder="EXT-12345" value={form.partnerProjectId} onChange={(e) => updateField('partnerProjectId', e.target.value)} />
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
        <div className="mt-1">
          <ColorPicker value={form.color} onChange={(c) => updateField('color', c)} />
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
            Manage projects · {projectPagination.total} total
          </p>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyForm); setShowAdd(true); }}>
          <Plus className="w-4 h-4" /> Add Project
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text" placeholder="Search by name, code, or project ID..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--text-tertiary)]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] rounded-xl">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-[var(--card-bg)]">
                <tr className="border-b border-[var(--border-secondary)]">
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Project ID</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Project</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Code</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Status</th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Team</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Duration</th>
                  <th className="text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="p-4 text-sm text-brand-600 dark:text-brand-400 font-mono font-medium">
                      {p.projectId || '—'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-sm font-medium text-[var(--text-primary)]">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)] font-mono">{p.code}</td>
                    <td className="p-4">{statusBadge(p.status)}</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium">
                        <Users className="w-3.5 h-3.5" />
                        {p.teamCount || 0}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">
                      {p.startDate && p.endDate ? `${new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} – ${new Date(p.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : '—'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p.id)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Archive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {projects.length === 0 && (
              <div className="text-center py-12">
                <FolderKanban className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">No projects found</p>
              </div>
            )}
          </div>
          <Pagination
            page={projectPagination.page}
            totalPages={projectPagination.totalPages}
            total={projectPagination.total}
            limit={limit}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Project</DialogTitle>
            <DialogDescription>Create a new project. Project ID is auto-generated.</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} isLoading={isLoading}>Create Project</Button>
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
            <Button onClick={handleEdit} isLoading={isLoading}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Project</DialogTitle>
            <DialogDescription>This project will be soft-deleted (archived).</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={isLoading}>Archive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
