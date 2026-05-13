import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, FolderKanban, Target, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { timesheetAPI } from '@/services/api';
import { EmptyState } from '@/components/shared/States';

interface AssignedProject {
  id: string;
  name: string;
  code: string;
  color: string;
  status: 'active' | 'completed' | 'on-hold';
  description?: string;
  startDate?: string;
  endDate?: string;
  role?: string;
}

export default function MyProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    async function fetchAssigned() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await timesheetAPI.getAssignedProjects();
        if (cancelled) return;
        const raw = res.data.data || [];
        // API now returns FLATTENED project objects with assignment_role
        setProjects(raw.map((p: any) => ({
          id: p.id,
          name: p.name || '',
          code: p.project_code || '',
          color: p.color || '#6366f1',
          status: p.status || 'active',
          description: p.description || '',
          startDate: p.start_date || '',
          endDate: p.end_date || '',
          role: p.assignment_role || '',
        })));
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load projects');
          setProjects([]);
        }
      }
      if (!cancelled) setIsLoading(false);
    }
    fetchAssigned();
    return () => { cancelled = true; };
  }, []);

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle className="w-10 h-10 text-danger-500" />
        <p className="text-sm text-[var(--text-secondary)]">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

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
              <p className="text-xl font-bold text-[var(--text-primary)]">{projects.length}</p>
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
                {projects.filter((p) => p.status === 'active').length}
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
                {projects.filter((p) => p.status === 'on-hold').length}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">On Hold</p>
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
          description={projects.length === 0 ? "You have no projects assigned yet. Contact your manager." : "Try adjusting your search or filter criteria"}
          action={projects.length > 0 ? { label: 'Clear filters', onClick: () => { setSearch(''); setStatusFilter('all'); } } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((project, i) => (
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
                          Code: {project.code} {project.role && `· Role: ${project.role}`}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>

                  {/* Date range */}
                  {(project.startDate || project.endDate) && (
                    <div className="text-xs text-[var(--text-tertiary)]">
                      {project.startDate && new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      {project.startDate && project.endDate && ' – '}
                      {project.endDate && new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  )}

                  {project.description && (
                    <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2">{project.description}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
