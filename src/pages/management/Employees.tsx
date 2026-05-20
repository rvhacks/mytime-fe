import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit3, Users, Search, Copy, Check, Eye, EyeOff, KeyRound, UserX, UserCheck, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/ui/avatar';
import { Pagination } from '@/components/shared/Pagination';
import { SearchableDropdown } from '@/components/shared/SearchableDropdown';
import { useManagementStore, generatePassword } from '@/store/managementStore';
import { employeeAPI, designationAPI } from '@/services/api';
import toast, { Toaster } from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const emptyForm = {
  employeeId: '', firstName: '', lastName: '', email: '', mobile: '', dob: '', designationId: '', joiningDate: '', reportingManagerId: '',
};

export default function Employees() {
  const {
    employees, designations, addEmployee, updateEmployee, deactivateEmployee, activateEmployee,
    resetEmployeePassword, fetchEmployees, fetchDesignations, isLoading, employeePagination,
  } = useManagementStore();

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<{ id: string; action: 'deactivate' | 'activate' } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [form, setForm] = useState(emptyForm);
  const [generatedPw, setGeneratedPw] = useState('');
  const [showPwDialog, setShowPwDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadPage = useCallback((p: number, l: number, s?: string, status?: string) => {
    fetchEmployees({ page: p, limit: l, search: s || search || undefined, status: status || statusFilter });
  }, [fetchEmployees, search, statusFilter]);

  useEffect(() => { loadPage(1, limit); fetchDesignations({ limit: 100 }); }, []);
  useEffect(() => { loadPage(page, limit); }, [page, limit]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadPage(1, limit, search, statusFilter); }, 300);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  const updateField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const previewPw = form.firstName && form.mobile && form.dob
    ? generatePassword(form.firstName, form.mobile, form.dob) : '';

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
    try {
      const newEmp = await addEmployee({
        employeeId: form.employeeId.trim() || undefined,
        firstName: form.firstName.trim(), lastName: form.lastName.trim(),
        email: form.email.trim(), mobile: form.mobile.trim(), dob: form.dob,
        designationId: form.designationId, joiningDate: form.joiningDate,
        reportingManagerId: form.reportingManagerId || undefined,
      });
      setGeneratedPw(newEmp.generatedPassword);
      setForm(emptyForm); setShowAdd(false); setShowPwDialog(true);
      toast.success('Employee created');
    } catch { toast.error('Failed to create employee'); }
  };

  const handleEdit = async () => {
    if (!editId) return;
    const err = validate();
    if (err) { toast.error(err); return; }
    await updateEmployee(editId, {
      employeeId: form.employeeId.trim() || undefined,
      firstName: form.firstName.trim(), lastName: form.lastName.trim(),
      email: form.email.trim(), mobile: form.mobile.trim(), dob: form.dob,
      designationId: form.designationId, joiningDate: form.joiningDate,
      reportingManagerId: form.reportingManagerId || null,
    });
    setForm(emptyForm); setEditId(null);
    toast.success('Employee updated');
  };

  const handleResetPassword = async (id: string) => {
    try {
      const pw = await resetEmployeePassword(id);
      setGeneratedPw(pw); setShowPwDialog(true);
      toast.success('Password reset successfully');
    } catch { toast.error('Failed to reset password'); }
  };

  const handleStatusAction = async () => {
    if (!statusAction) return;
    if (statusAction.action === 'deactivate') {
      await deactivateEmployee(statusAction.id);
      toast.success('Employee deactivated');
    } else {
      await activateEmployee(statusAction.id);
      toast.success('Employee activated');
    }
    setStatusAction(null);
  };

  const openEdit = (id: string) => {
    const e = employees.find((x) => x.id === id);
    if (!e) return;
    setForm({
      employeeId: e.employeeId || '',
      firstName: e.firstName, lastName: e.lastName, email: e.email,
      mobile: e.mobile, dob: e.dob, designationId: e.designationId, joiningDate: e.joiningDate,
      reportingManagerId: e.reportingManagerId || '',
    });
    setEditId(id);
  };

  const copyPw = () => {
    navigator.clipboard.writeText(generatedPw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDesignationName = (id: string) => designations.find((d) => d.id === id)?.name || '—';

  // SearchableDropdown fetch function for reporting manager
  const fetchManagerOptions = async (params: { search: string; page: number; limit: number }) => {
    const res = await employeeAPI.getAll({ search: params.search, page: params.page, limit: params.limit, status: 'active' });
    const data = res.data.data;
    return {
      rows: (data?.rows || []).filter((u: any) => u.id !== editId).map((u: any) => ({
        id: u.id,
        label: `${u.first_name || u.firstName} ${u.last_name || u.lastName}`,
      })).sort((a: any, b: any) => a.label.localeCompare(b.label)),
      pagination: data?.pagination || { page: 1, totalPages: 1, total: 0 },
    };
  };

  const fetchDesignationOptions = async (params: { search: string; page: number; limit: number }) => {
    const res = await designationAPI.getAll({ search: params.search, page: params.page, limit: params.limit });
    const data = res.data.data;
    return {
      rows: (data?.rows || []).map((d: any) => ({
        id: d.id,
        label: d.name,
      })).sort((a: any, b: any) => a.label.localeCompare(b.label)),
      pagination: data?.pagination || { page: 1, totalPages: 1, total: 0 },
    };
  };

  const formFields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label>Employee ID <span className="text-[var(--text-tertiary)]">(auto-generated if empty)</span></Label>
        <Input placeholder={`CT${String(new Date().getFullYear()).slice(-2)}-0001`} value={form.employeeId} onChange={(e) => updateField('employeeId', e.target.value)} />
      </div>
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
        <SearchableDropdown
          value={form.designationId}
          onChange={(val) => updateField('designationId', val)}
          fetchFn={fetchDesignationOptions}
          getOptionValue={(item) => item.id}
          getOptionLabel={(item) => item.label}
          placeholder="Search designation..."
        />
      </div>
      <div>
        <Label>Joining Date *</Label>
        <Input type="date" value={form.joiningDate} onChange={(e) => updateField('joiningDate', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Reporting Manager <span className="text-[var(--text-tertiary)]">(optional)</span></Label>
        <SearchableDropdown
          value={form.reportingManagerId}
          onChange={(val) => updateField('reportingManagerId', val)}
          fetchFn={fetchManagerOptions}
          getOptionValue={(item) => item.id}
          getOptionLabel={(item) => item.label}
          placeholder="Search reporting manager..."
        />
      </div>
      {!editId && previewPw && (
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
            Manage employees · {employeePagination.total} total
          </p>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyForm); setShowPw(false); setShowAdd(true); }}>
          <Plus className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text" placeholder="Search employees..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--text-tertiary)]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] rounded-xl">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-[var(--card-bg)]">
                <tr className="border-b border-[var(--border-secondary)]">
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Emp ID</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Employee</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Email</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Designation</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Reporting Manager</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Status</th>
                  <th className="text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id} className="border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="p-4 text-sm text-brand-600 dark:text-brand-400 font-mono font-medium">
                      {e.employeeId || '—'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${e.firstName} ${e.lastName}`} size="sm" />
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {e.firstName} {e.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">{e.email}</td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">{getDesignationName(e.designationId)}</td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">{e.reportingManagerName || '—'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        e.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${e.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {e.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(e.id)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleResetPassword(e.id)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Reset Password">
                          <KeyRound className="w-4 h-4" />
                        </button>
                        {e.status === 'active' ? (
                          <button onClick={() => setStatusAction({ id: e.id, action: 'deactivate' })} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Deactivate">
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => setStatusAction({ id: e.id, action: 'activate' })} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" title="Activate">
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {employees.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">No employees found</p>
              </div>
            )}
          </div>
          <Pagination
            page={employeePagination.page}
            totalPages={employeePagination.totalPages}
            total={employeePagination.total}
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

      {/* Deactivate/Activate Confirm */}
      <Dialog open={!!statusAction} onOpenChange={() => setStatusAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{statusAction?.action === 'deactivate' ? 'Deactivate Employee' : 'Activate Employee'}</DialogTitle>
            <DialogDescription>
              {statusAction?.action === 'deactivate'
                ? 'The employee will no longer be able to login. This can be reversed.'
                : 'The employee will be able to login again.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusAction(null)}>Cancel</Button>
            <Button
              variant={statusAction?.action === 'deactivate' ? 'destructive' : 'default'}
              onClick={handleStatusAction}
              isLoading={isLoading}
            >
              {statusAction?.action === 'deactivate' ? 'Deactivate' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
