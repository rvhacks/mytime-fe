import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Target, Search, Edit3, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/shared/Pagination';
import { milestoneAPI } from '@/services/api';
import type { ProjectRole, PaginationInfo } from '@/types';
import { PROJECT_ROLE_KEYS, getRoleLabel } from '@/constants/roles';
import toast, { Toaster } from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

interface MilestoneItem {
  id: string;
  name: string;
  description: string;
  role: ProjectRole;
}

const defaultPagination: PaginationInfo = { page: 1, limit: 10, total: 0, totalPages: 1 };

export default function Milestones() {
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(defaultPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<MilestoneItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formRole, setFormRole] = useState<string>('');

  const fetchMilestones = useCallback(async (p: number, l: number, s?: string) => {
    setIsLoading(true);
    try {
      const res = await milestoneAPI.getAll({ page: p, limit: l, search: s || search || undefined });
      const rows = res.data.data?.rows || res.data.data || [];
      setMilestones(Array.isArray(rows) ? rows.map((m: any) => ({
        id: m.id, name: m.name, description: m.description || '', role: m.role,
      })) : []);
      const pg = res.data.data?.pagination;
      setPagination(pg ? { page: pg.page, limit: pg.limit, total: pg.total, totalPages: pg.totalPages } : defaultPagination);
    } catch { /* silent */ }
    setIsLoading(false);
  }, [search]);

  useEffect(() => { fetchMilestones(1, limit); }, []);
  useEffect(() => { fetchMilestones(page, limit); }, [page, limit]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchMilestones(1, limit, search); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = roleFilter === 'all' ? milestones : milestones.filter((m) => m.role === roleFilter);

  const resetForm = () => { setFormName(''); setFormDesc(''); setFormRole(''); };

  const handleAdd = async () => {
    if (!formName.trim()) { toast.error('Name is required'); return; }
    if (!formRole) { toast.error('Role is required'); return; }
    setIsLoading(true);
    try {
      await milestoneAPI.create({ name: formName.trim(), description: formDesc.trim(), role: formRole });
      toast.success('Milestone created');
      resetForm(); setShowAdd(false);
      fetchMilestones(page, limit);
    } catch { toast.error('Failed to create milestone'); }
    setIsLoading(false);
  };

  const handleEdit = async () => {
    if (!editTarget || !formName.trim()) return;
    setIsLoading(true);
    try {
      await milestoneAPI.update(editTarget.id, { name: formName.trim(), description: formDesc.trim(), role: formRole || editTarget.role });
      toast.success('Milestone updated');
      resetForm(); setEditTarget(null);
      fetchMilestones(page, limit);
    } catch { toast.error('Failed to update milestone'); }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsLoading(true);
    try {
      await milestoneAPI.delete(deleteTarget);
      toast.success('Milestone deleted');
      setDeleteTarget(null);
      fetchMilestones(page, limit);
    } catch { toast.error('Failed to delete milestone'); }
    setIsLoading(false);
  };

  const openEdit = (m: MilestoneItem) => {
    setFormName(m.name); setFormDesc(m.description); setFormRole(m.role);
    setEditTarget(m);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Milestones</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Manage role-based milestones · {pagination.total} total
          </p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowAdd(true); }}>
          <Plus className="w-4 h-4" /> Add Milestone
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text" placeholder="Search milestones..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--text-tertiary)]" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="all">All Roles</option>
            {PROJECT_ROLE_KEYS.map((r) => (
              <option key={r} value={r}>{getRoleLabel(r)}</option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)]">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-[var(--card-bg)]">
                <tr className="border-b border-[var(--border-secondary)]">
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Milestone</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Role</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Description</th>
                  <th className="text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-brand-500" />
                        <span className="text-sm font-medium text-[var(--text-primary)]">{m.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">
                        {getRoleLabel(m.role)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)] max-w-[300px] truncate">{m.description || '—'}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(m)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(m.id)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Target className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">No milestones found</p>
              </div>
            )}
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={limit}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
            <DialogDescription>Create a new role-based milestone</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input placeholder="e.g. Code Review" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <Label>Role *</Label>
              <select
                value={formRole} onChange={(e) => setFormRole(e.target.value)}
                className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="">Select role</option>
                {PROJECT_ROLE_KEYS.map((r) => (
                  <option key={r} value={r}>{getRoleLabel(r)}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                placeholder="Milestone description..."
                value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                className="w-full min-h-[80px] rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30 placeholder:text-[var(--text-tertiary)] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} isLoading={isLoading}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Milestone</DialogTitle>
            <DialogDescription>Update milestone details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <Label>Role *</Label>
              <select
                value={formRole} onChange={(e) => setFormRole(e.target.value)}
                className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                {PROJECT_ROLE_KEYS.map((r) => (
                  <option key={r} value={r}>{getRoleLabel(r)}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                className="w-full min-h-[80px] rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30 placeholder:text-[var(--text-tertiary)] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleEdit} isLoading={isLoading}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Milestone</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={isLoading}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
