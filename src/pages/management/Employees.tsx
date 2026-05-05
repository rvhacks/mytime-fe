import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, Users, Search, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/ui/avatar';
import { useManagementStore, generatePassword } from '@/store/managementStore';
import toast, { Toaster } from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const emptyForm = {
  firstName: '', lastName: '', email: '', mobile: '', dob: '', designationId: '', joiningDate: '',
};

export default function Employees() {
  const { employees, designations, addEmployee, updateEmployee, deleteEmployee, isLoading } = useManagementStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [generatedPw, setGeneratedPw] = useState('');
  const [showPwDialog, setShowPwDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    const full = `${e.firstName} ${e.lastName}`.toLowerCase();
    return full.includes(q) || e.email.toLowerCase().includes(q);
  });

  const updateField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  // Live password preview
  const previewPw = form.firstName && form.mobile && form.dob
    ? generatePassword(form.firstName, form.mobile, form.dob)
    : '';

  const validate = (): string | null => {
    if (!form.firstName.trim()) return 'First name is required';
    if (!form.lastName.trim()) return 'Last name is required';
    if (!form.email.trim() || !form.email.includes('@')) return 'Valid email is required';
    if (!form.mobile.trim() || form.mobile.length < 10) return 'Valid mobile number is required';
    if (!form.dob) return 'Date of birth is required';
    if (!form.designationId) return 'Designation is required';
    if (!form.joiningDate) return 'Joining date is required';
    return null;
  };

  const handleAdd = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    if (employees.some((e) => e.email.toLowerCase() === form.email.trim().toLowerCase())) {
      toast.error('An employee with this email already exists'); return;
    }
    const newEmp = await addEmployee({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      dob: form.dob,
      designationId: form.designationId,
      joiningDate: form.joiningDate,
    });
    setGeneratedPw(newEmp.generatedPassword);
    setForm(emptyForm);
    setShowAdd(false);
    setShowPwDialog(true);
    toast.success('Employee created');
  };

  const handleEdit = async () => {
    if (!editId) return;
    const err = validate();
    if (err) { toast.error(err); return; }
    const pw = generatePassword(form.firstName, form.mobile, form.dob);
    await updateEmployee(editId, {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      dob: form.dob,
      designationId: form.designationId,
      joiningDate: form.joiningDate,
      generatedPassword: pw,
    });
    setForm(emptyForm); setEditId(null);
    toast.success('Employee updated');
  };

  const openEdit = (id: string) => {
    const e = employees.find((x) => x.id === id);
    if (!e) return;
    setForm({
      firstName: e.firstName, lastName: e.lastName, email: e.email,
      mobile: e.mobile, dob: e.dob, designationId: e.designationId, joiningDate: e.joiningDate,
    });
    setEditId(id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteEmployee(deleteId);
    setDeleteId(null);
    toast.success('Employee deleted');
  };

  const copyPw = () => {
    navigator.clipboard.writeText(generatedPw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDesignationName = (id: string) => designations.find((d) => d.id === id)?.name || '—';

  const formFields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label>First Name *</Label>
        <Input placeholder="Alex" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} />
      </div>
      <div>
        <Label>Last Name *</Label>
        <Input placeholder="Johnson" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} />
      </div>
      <div>
        <Label>Email *</Label>
        <Input type="email" placeholder="alex@crystalts.com" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
      </div>
      <div>
        <Label>Mobile Number *</Label>
        <Input type="tel" placeholder="5551234567" value={form.mobile} onChange={(e) => updateField('mobile', e.target.value.replace(/\D/g, ''))} />
      </div>
      <div>
        <Label>Date of Birth *</Label>
        <Input type="date" value={form.dob} onChange={(e) => updateField('dob', e.target.value)} />
      </div>
      <div>
        <Label>Designation *</Label>
        <select
          value={form.designationId} onChange={(e) => updateField('designationId', e.target.value)}
          className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="">Select designation</option>
          {designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div>
        <Label>Joining Date *</Label>
        <Input type="date" value={form.joiningDate} onChange={(e) => updateField('joiningDate', e.target.value)} />
      </div>
      {previewPw && (
        <div>
          <Label>Auto-generated Password</Label>
          <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-dashed border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-900/10">
            <code className="text-sm font-mono text-brand-600 dark:text-brand-400 flex-1">
              {showPw ? previewPw : '••••••••••••'}
            </code>
            <button onClick={() => setShowPw(!showPw)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Employees</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Manage employees · {employees.length} total
          </p>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyForm); setShowPw(false); setShowAdd(true); }}>
          <Plus className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          type="text" placeholder="Search employees..."
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
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Email</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Mobile</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Designation</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Joining</th>
                  <th className="text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((e) => (
                    <motion.tr
                      key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={`${e.firstName} ${e.lastName}`} size="sm" />
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {e.firstName} {e.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">{e.email}</td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">{e.mobile}</td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">{getDesignationName(e.designationId)}</td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">
                        {new Date(e.joiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(e.id)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(e.id)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors">
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
                <Users className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">No employees found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
            <DialogDescription>Create a new employee. Password is auto-generated.</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} isLoading={isLoading}>Create Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editId} onOpenChange={() => setEditId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee details</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
            <Button onClick={handleEdit} isLoading={isLoading}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={showPwDialog} onOpenChange={setShowPwDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Employee Created</DialogTitle>
            <DialogDescription>Share the generated password with the employee securely.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800">
            <code className="text-lg font-mono font-bold text-accent-700 dark:text-accent-300 flex-1 tracking-wider">{generatedPw}</code>
            <Button variant="outline" size="sm" onClick={copyPw}>
              {copied ? <Check className="w-4 h-4 text-accent-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPwDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
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
