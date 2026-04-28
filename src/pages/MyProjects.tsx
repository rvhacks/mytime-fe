import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, FolderKanban, Users, Target, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { EmptyState } from '@/components/shared/States';

export default function MyProjects() {
  const { user } = useAuthStore();
  const { projects } = useAdminStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter projects assigned to current user
  const assignedProjects = projects.filter((p) =>
    user ? p.assignedEmployees.includes(user.id) : false
  );

  const filtered = assignedProjects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalMilestones = (p: typeof projects[0]) => p.milestones.length;
  const completedMilestones = (p: typeof projects[0]) =>
    p.milestones.filter((m) => m.status === 'completed').length;
  const inProgressMilestones = (p: typeof projects[0]) =>
    p.milestones.filter((m) => m.status === 'in-progress').length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Projects</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Projects assigned to you and their progress
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--text-primary)]">{assignedProjects.length}</p>
              <p className="text-xs text-[var(--text-secondary)]">Total Projects</p>
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
                {assignedProjects.filter((p) => p.status === 'active').length}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-50 dark:bg-warning-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {assignedProjects.reduce((sum, p) => sum + inProgressMilestones(p), 0)}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">In-Progress Milestones</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
        </select>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Try adjusting your search or filter criteria"
          action={{ label: 'Clear filters', onClick: () => { setSearch(''); setStatusFilter('all'); } }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((project, i) => {
            const total = totalMilestones(project);
            const completed = completedMilestones(project);
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300 group overflow-hidden cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                  {/* Color bar */}
                  <div className="h-1" style={{ backgroundColor: project.color }} />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ backgroundColor: project.color }}
                        >
                          {project.code.slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-brand-500 transition-colors">
                            {project.name}
                          </h3>
                          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                            Code: {project.code} · {project.assignedEmployees.length} members
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-[var(--text-tertiary)]">Milestone Progress</span>
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          {completed}/{total} ({progress}%)
                        </span>
                      </div>
                      <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-700"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: project.color,
                          }}
                        />
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Milestones
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {project.milestones.map((m) => (
                          <span
                            key={m.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                              m.status === 'completed'
                                ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400'
                                : m.status === 'in-progress'
                                ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                m.status === 'completed'
                                  ? 'bg-accent-500'
                                  : m.status === 'in-progress'
                                  ? 'bg-brand-500'
                                  : 'bg-[var(--text-tertiary)]'
                              }`}
                            />
                            {m.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
