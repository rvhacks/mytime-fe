import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Target, Search, Edit3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { milestoneAPI } from '@/services/api';
import type { ProjectRole } from '@/types';
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

export default function Milestones() {
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<MilestoneItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formRole, setFormRole] = useState<string>('');

  const fetchMilestones = async () => {
    setIsLoading(true);
    try {
      const res = await milestoneAPI.getAll({ limit: 100 });
      const rows = res.data.data?.rows || [];
      setMilestones(rows.map((m: any) => ({
        id: m.id,
        name: m.name,
        description: m.description || '',
        role: m.role,
      })));
    } catch { /* silent */ }
    setIsLoading(false);
  };

  useEffect(() => { fetchMilestones(); }, []);

  const filtered = milestones.filter((m) => {
    if (roleFilter !== 'all' && m.role !== roleFilter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormRole('');
  };

  const handleAdd = async () => {
    if (!formName.trim()) { toast.error('Milestone name is required'); return; }
    if (!formRole) { toast.error('Role is required'); return; }
    try {
      await milestoneAPI.create({ name: formName.trim(), description: formDesc, role: formRole });
      resetForm();
      setShowAdd(false);
      toast.success('Milestone created');
      fetchMilestones();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create milestone');
    }
  };

  const openEdit = (m: MilestoneItem) => {
    setEditTarget(m);
    setFormName(m.name);
    setFormDesc(m.description);
    setFormRole(m.role);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!formName.trim()) { toast.error('Milestone name is required'); return; }
    if (!formRole) { toast.error('Role is required'); return; }
    try {
      await milestoneAPI.update(editTarget.id, { name: formName.trim(), description: formDesc, role: formRole });
      resetForm();
      setEditTarget(null);
      toast.success('Milestone updated');
      fetchMilestones();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update milestone');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await milestoneAPI.delete(deleteTarget);
      setDeleteTarget(null);
      toast.success('Milestone deleted');
      fetchMilestones();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete milestone');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Milestones</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Manage role-based milestone templates · {milestones.length} total
          </p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowAdd(true); }}>
          <Plus className="w-4 h-4" /> Add Milestone
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input type="text" placeholder="Search milestones..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
          <option value="all">All Roles</option>
                          {PROJECT_ROLE_KEYS.map((r) => <option key={r} value={r}>{r} — {getRoleLabel(r)}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-secondary)]">
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Milestone</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Description</th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Role</th>
                  <th className="text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((m) => (
                    <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-brand-500" />
                          <span className="text-sm font-medium text-[var(--text-primary)]">{m.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-[var(--text-secondary)]">{m.description || '—'}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400">
                          {m.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(m)}
                            className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(m.id)}
                            className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors">
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
                <Target className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">{isLoading ? 'Loading...' : 'No milestones found'}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
            <DialogDescription>Create a reusable role-based milestone template</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Milestone Name *</Label>
              <Input placeholder="e.g. MVP Release" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <Label>Description <span className="text-[var(--text-tertiary)]">(optional)</span></Label>
              <textarea placeholder="Description..."
                value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                className="w-full min-h-[80px] rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30 placeholder:text-[var(--text-tertiary)] resize-none"
              />
            </div>
            <div>
              <Label>Role *</Label>
              <select value={formRole} onChange={(e) => setFormRole(e.target.value)}
                className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                <option value="">Select role</option>
                                {PROJECT_ROLE_KEYS.map((r) => <option key={r} value={r}>{r} — {getRoleLabel(r)}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Create Milestone</Button>
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
              <Label>Milestone Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <Label>Description <span className="text-[var(--text-tertiary)]">(optional)</span></Label>
              <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                className="w-full min-h-[80px] rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30 placeholder:text-[var(--text-tertiary)] resize-none"
              />
            </div>
            <div>
              <Label>Role *</Label>
              <select value={formRole} onChange={(e) => setFormRole(e.target.value)}
                className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                <option value="">Select role</option>
                                {PROJECT_ROLE_KEYS.map((r) => <option key={r} value={r}>{r} — {getRoleLabel(r)}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Milestone</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
