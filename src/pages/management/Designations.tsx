import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit3, Trash2, Tag, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/shared/Pagination';
import { useManagementStore } from '@/store/managementStore';
import toast, { Toaster } from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

export default function Designations() {
  const { designations, addDesignation, updateDesignation, deleteDesignation, fetchDesignations, isLoading, designationPagination } = useManagementStore();

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadPage = useCallback((p: number, l: number, s?: string) => {
    fetchDesignations({ page: p, limit: l, search: s || search || undefined });
  }, [fetchDesignations, search]);

  useEffect(() => { loadPage(1, limit); }, []);
  useEffect(() => { loadPage(page, limit); }, [page, limit]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadPage(1, limit, search); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleAdd = async () => {
    if (!name.trim()) { toast.error('Designation name is required'); return; }
    await addDesignation(name.trim());
    setName(''); setShowAdd(false);
    toast.success('Designation created');
    loadPage(1, limit);
  };

  const handleEdit = async () => {
    if (!editId || !name.trim()) return;
    await updateDesignation(editId, name.trim());
    setName(''); setEditId(null);
    toast.success('Designation updated');
    loadPage(page, limit);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDesignation(deleteId);
    setDeleteId(null);
    toast.success('Designation deleted');
    loadPage(page, limit);
  };

  const openEdit = (id: string) => {
    const d = designations.find((x) => x.id === id);
    if (d) { setName(d.name); setEditId(id); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Designations</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Manage employee designations · {designationPagination.total} total
          </p>
        </div>
        <Button size="sm" onClick={() => { setName(''); setShowAdd(true); }}>
          <Plus className="w-4 h-4" /> Add Designation
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          type="text" placeholder="Search designations..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)]">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-[var(--card-bg)]">
                <tr className="border-b border-[var(--border-secondary)]">
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">#</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Designation Name</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Created</th>
                  <th className="text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {designations.map((d, i) => (
                  <tr key={d.id} className="border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="p-4 text-sm text-[var(--text-tertiary)]">{(page - 1) * limit + i + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-brand-500" />
                        <span className="text-sm font-medium text-[var(--text-primary)]">{d.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">
                      {d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(d.id)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(d.id)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {designations.length === 0 && (
              <div className="text-center py-12">
                <Tag className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">No designations found</p>
              </div>
            )}
          </div>
          <Pagination
            page={designationPagination.page}
            totalPages={designationPagination.totalPages}
            total={designationPagination.total}
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
            <DialogTitle>Add Designation</DialogTitle>
            <DialogDescription>Create a new employee designation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Designation Name</Label>
              <Input placeholder="e.g. Senior Developer" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} isLoading={isLoading}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editId} onOpenChange={() => setEditId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Designation</DialogTitle>
            <DialogDescription>Update the designation name</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Designation Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
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
            <DialogTitle>Delete Designation</DialogTitle>
            <DialogDescription>Are you sure you want to delete this designation? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={isLoading}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
