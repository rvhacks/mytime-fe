import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, Target, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAdminStore } from '@/store/adminStore';
import type { ProjectRole } from '@/types';
import toast, { Toaster } from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const PROJECT_ROLES: ProjectRole[] = ['IC', 'MS', 'TPM', 'PM', 'QA', 'BA'];

export default function Milestones() {
  const { projects, addMilestone, updateProject } = useAdminStore();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ projectId: string; milestoneId: string } | null>(null);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');

  const [formProjectId, setFormProjectId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formRole, setFormRole] = useState('');

  // Flatten milestones from all projects
  const allMilestones = projects.flatMap((p) =>
    p.milestones.map((m) => ({ ...m, projectName: p.name, projectColor: p.color }))
  );

  const filtered = allMilestones.filter((m) => {
    if (projectFilter !== 'all' && m.projectId !== projectFilter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAdd = () => {
    if (!formProjectId) { toast.error('Select a project'); return; }
    if (!formName.trim()) { toast.error('Milestone name is required'); return; }
    addMilestone(formProjectId, formName.trim());
    // Note: addMilestone in adminStore only takes name. We'll update after to add desc/role if needed
    setFormProjectId(''); setFormName(''); setFormDesc(''); setFormRole('');
    setShowAdd(false);
    toast.success('Milestone created');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const project = projects.find((p) => p.id === deleteTarget.projectId);
    if (!project) return;
    updateProject(deleteTarget.projectId, {
      milestones: project.milestones.filter((m) => m.id !== deleteTarget.milestoneId),
    });
    setDeleteTarget(null);
    toast.success('Milestone deleted');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Milestones</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Manage project milestones · {allMilestones.length} total
          </p>
        </div>
        <Button size="sm" onClick={() => { setFormProjectId(''); setFormName(''); setFormDesc(''); setFormRole(''); setShowAdd(true); }}>
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
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}
          className="h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
          <option value="all">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Project</th>
                  <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Status</th>
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
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.projectColor }} />
                          <span className="text-sm text-[var(--text-secondary)]">{m.projectName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center"><StatusBadge status={m.status} /></td>
                      <td className="p-4">
                        <div className="flex justify-end">
                          <button onClick={() => setDeleteTarget({ projectId: m.projectId, milestoneId: m.id })}
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
                <p className="text-sm text-[var(--text-tertiary)]">No milestones found</p>
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
            <DialogDescription>Create a new milestone for a project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project *</Label>
              <select value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)}
                className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                <option value="">Select project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
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
              <Label>Role <span className="text-[var(--text-tertiary)]">(optional)</span></Label>
              <select value={formRole} onChange={(e) => setFormRole(e.target.value)}
                className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                <option value="">Select role</option>
                {PROJECT_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Create Milestone</Button>
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
