import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit3,
  Trash2,
  Users,
  FolderOpen,
  Target,
  BarChart3,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/States';
import { useAdminStore } from '@/store/adminStore';
import { useManagementStore } from '@/store/managementStore';
import { useEffect } from 'react';

const MONTHLY_OVERVIEW = [
  { name: 'Jan', hours: 168, expected: 176, billable: 136, nonBillable: 32 },
  { name: 'Feb', hours: 160, expected: 160, billable: 128, nonBillable: 32 },
  { name: 'Mar', hours: 172, expected: 176, billable: 140, nonBillable: 32 },
  { name: 'Apr', hours: 146, expected: 176, billable: 110, nonBillable: 36 },
];
import toast, { Toaster } from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function AdminPanel() {
  const { projects, fetchProjects, addProject, updateProject, deleteProject } = useAdminStore();
  const { employees, fetchEmployees } = useManagementStore();

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, []);
  const [activeTab, setActiveTab] = useState<'projects' | 'milestones' | 'overview'>('projects');
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState<string | null>(null);
  const [editProject, setEditProject] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Form states
  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [projectColor, setProjectColor] = useState('#6366f1');
  const [milestoneName, setMilestoneName] = useState('');

  const tabs = [
    { id: 'projects' as const, label: 'Projects', icon: FolderOpen },
    { id: 'milestones' as const, label: 'Milestones', icon: Target },
    { id: 'overview' as const, label: 'System Overview', icon: BarChart3 },
  ];

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddProject = async () => {
    if (!projectName.trim() || !projectCode.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    await addProject({
      name: projectName,
      code: projectCode.toUpperCase(),
      color: projectColor,
      status: 'active',
      assignedEmployees: [],
    });
    setProjectName('');
    setProjectCode('');
    setShowAddProject(false);
    toast.success('Project created successfully');
  };

  const handleAddMilestone = async () => {
    if (!milestoneName.trim() || !showAddMilestone) return;
    try {
      const { milestoneAPI } = await import('@/services/api');
      await milestoneAPI.create({ projectId: showAddMilestone, name: milestoneName });
      await fetchProjects();
      setMilestoneName('');
      setShowAddMilestone(null);
      toast.success('Milestone added');
    } catch { toast.error('Failed to add milestone'); }
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    toast.success('Project deleted');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Admin Panel</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Manage projects, milestones, and system settings
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--text-primary)]">{projects.length}</p>
              <p className="text-xs text-[var(--text-secondary)]">Projects</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-accent-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {projects.reduce((sum, p) => sum + (p.milestones?.length || 0), 0)}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Milestones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--text-primary)]">{employees.length}</p>
              <p className="text-xs text-[var(--text-secondary)]">Team Members</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-50 dark:bg-warning-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-warning-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {projects.filter((p) => p.status === 'active').length}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Active Projects</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--bg-tertiary)] rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-[var(--bg-tertiary)] border-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <Button id="add-project-btn" size="sm" onClick={() => setShowAddProject(true)}>
              <Plus className="w-4 h-4" /> Add Project
            </Button>
          </div>

          <div className="space-y-3">
            {filteredProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: project.color }}
                        >
                          {project.code.slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{project.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-[var(--text-tertiary)]">Code: {project.code}</span>
                            <span className="text-xs text-[var(--text-tertiary)]">•</span>
                            <span className="text-xs text-[var(--text-tertiary)]">{(project.milestones?.length || 0)} milestones</span>
                            <span className="text-xs text-[var(--text-tertiary)]">•</span>
                            <span className="text-xs text-[var(--text-tertiary)]">{project.assignedEmployees.length} assigned</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={project.status} />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowAddMilestone(project.id)}
                        >
                          <Target className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-danger-500 hover:text-danger-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Milestones */}
                    {(project.milestones?.length || 0) > 0 && (
                      <div className="mt-4 pt-4 border-t border-[var(--border-secondary)]">
                        <div className="flex flex-wrap gap-2">
                          {(project.milestones || []).map((m: any) => (
                            <span
                              key={m.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                m.status === 'completed' ? 'bg-accent-500' :
                                m.status === 'in-progress' ? 'bg-brand-500' :
                                'bg-surface-400'
                              }`} />
                              {m.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Milestones Tab */}
      {activeTab === 'milestones' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-secondary)]">
                    <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Milestone</th>
                    <th className="text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Project</th>
                    <th className="text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.flatMap((p) =>
                    (p.milestones || []).map((m: any) => (
                      <tr key={m.id} className="border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors">
                        <td className="py-3 px-4 text-sm text-[var(--text-primary)]">{m.name}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                            {p.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={m.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System-Wide Hours (Monthly)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MONTHLY_OVERVIEW}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                    <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} />
                    <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} name="Logged" />
                    <Bar dataKey="expected" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Expected" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Add Project Dialog */}
      <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Add a new project to the system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label required>Project Name</Label>
              <Input
                placeholder="e.g., Project Phoenix"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label required>Project Code</Label>
                <Input
                  placeholder="e.g., PHX"
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value)}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={projectColor}
                    onChange={(e) => setProjectColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-[var(--input-border)] cursor-pointer"
                  />
                  <span className="text-sm text-[var(--text-secondary)]">{projectColor}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProject(false)}>Cancel</Button>
            <Button onClick={handleAddProject}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Milestone Dialog */}
      <Dialog open={!!showAddMilestone} onOpenChange={() => setShowAddMilestone(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
            <DialogDescription>
              Add a milestone to {projects.find((p) => p.id === showAddMilestone)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label required>Milestone Name</Label>
            <Input
              placeholder="e.g., Phase 1 - Design"
              value={milestoneName}
              onChange={(e) => setMilestoneName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMilestone(null)}>Cancel</Button>
            <Button onClick={handleAddMilestone}>Add Milestone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
