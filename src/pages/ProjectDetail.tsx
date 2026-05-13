import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FolderKanban,
  Users,
  Target,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  CalendarDays,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Avatar } from '@/components/ui/avatar';
import { timesheetAPI } from '@/services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

interface ProjectData {
  id: string;
  name: string;
  project_code: string;
  color: string;
  status: string;
  description?: string;
  assignments: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  }>;
  milestones?: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);
    setError(false);
    timesheetAPI.getProjectDetail(projectId)
      .then((res) => {
        setProject(res.data.data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => setIsLoading(false));
  }, [projectId]);

  // Team members from project assignments
  const teamMembers = useMemo(() => {
    if (!project?.assignments) return [];
    return project.assignments.map((a) => ({
      id: a.user.id,
      name: `${a.user.first_name} ${a.user.last_name}`,
      email: a.user.email,
      role: a.role || 'Member',
    }));
  }, [project]);

  // Milestone stats
  const milestones = project?.milestones || [];
  const milestoneStats = useMemo(() => {
    const completed = milestones.filter((m) => m.status === 'completed').length;
    const inProgress = milestones.filter((m) => m.status === 'in-progress').length;
    const pending = milestones.filter((m) => m.status === 'pending').length;
    return { total: milestones.length, completed, inProgress, pending };
  }, [milestones]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <FolderKanban className="w-12 h-12 text-[var(--text-tertiary)]" />
        <p className="text-lg font-medium text-[var(--text-primary)]">Project not found</p>
        <Button size="sm" onClick={() => navigate('/projects')}>
          Back to My Projects
        </Button>
      </div>
    );
  }

  const progress = milestoneStats.total > 0
    ? Math.round((milestoneStats.completed / milestoneStats.total) * 100)
    : 0;

  const milestoneIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-accent-500" />;
    if (status === 'in-progress') return <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />;
    return <Circle className="w-4 h-4 text-[var(--text-tertiary)]" />;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Back + Header */}
      <motion.div variants={itemVariants}>
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Projects
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0"
              style={{ backgroundColor: project.color, boxShadow: `0 8px 24px ${project.color}40` }}
            >
              {project.project_code.slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{project.name}</h1>
              <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
                Code: {project.project_code} · {teamMembers.length} team members
              </p>
            </div>
          </div>
          <StatusBadge status={project.status} />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--text-primary)]">{teamMembers.length}</p>
                <p className="text-xs text-[var(--text-secondary)]">Team Members</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-accent-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-accent-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-accent-600 dark:text-accent-400">{milestoneStats.total}</p>
                <p className="text-xs text-[var(--text-secondary)]">Total Milestones</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--text-primary)]">{milestoneStats.completed}</p>
                <p className="text-xs text-[var(--text-secondary)]">Completed</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-secondary)]">Progress</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">{progress}%</span>
              </div>
              <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, backgroundColor: project.color }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Milestones */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[var(--text-tertiary)]" />
                Milestones
                <span className="text-xs font-normal text-[var(--text-tertiary)] ml-1">
                  ({milestoneStats.completed}/{milestoneStats.total} completed)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {milestones.length > 0 ? (
                <div className="space-y-1">
                  {milestones.map((milestone, i) => (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`flex items-center gap-4 p-3.5 rounded-xl transition-colors ${
                        milestone.status === 'in-progress'
                          ? 'bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800/30'
                          : 'hover:bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      {milestoneIcon(milestone.status)}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            milestone.status === 'completed'
                              ? 'text-[var(--text-tertiary)] line-through'
                              : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {milestone.name}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          milestone.status === 'completed'
                            ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400'
                            : milestone.status === 'in-progress'
                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                        }`}
                      >
                        {milestone.status === 'in-progress'
                          ? 'In Progress'
                          : milestone.status === 'completed'
                          ? 'Completed'
                          : 'Pending'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CalendarDays className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-2" />
                  <p className="text-sm text-[var(--text-tertiary)]">No milestones defined</p>
                </div>
              )}

              {/* Milestone Summary */}
              {milestones.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[var(--border-secondary)] grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-accent-500">{milestoneStats.completed}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-brand-500">{milestoneStats.inProgress}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">In Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[var(--text-tertiary)]">{milestoneStats.pending}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Pending</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Members */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--text-tertiary)]" />
                Team Members
                <span className="text-xs font-normal text-[var(--text-tertiary)] ml-1">({teamMembers.length})</span>
              </CardTitle>
              {teamMembers.length > 0 && (
                <button
                  onClick={() => navigate(`/projects/${projectId}/team`)}
                  className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
                >
                  View All
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </CardHeader>
            <CardContent>
              {teamMembers.length > 0 ? (
                <div className="space-y-1">
                  {teamMembers.map((member, i) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <Avatar name={member.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] truncate">
                          {member.email}
                        </p>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400">
                        {member.role}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-2" />
                  <p className="text-sm text-[var(--text-tertiary)]">No team members</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
