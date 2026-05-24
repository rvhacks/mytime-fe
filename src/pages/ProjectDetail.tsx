import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FolderKanban,
  Users,
  Mail,
  Phone,
  Loader2,
  CalendarDays,
  Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Avatar } from '@/components/ui/avatar';
import { timesheetAPI } from '@/services/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

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
  project_id?: string;
  partner_project_id?: string;
  color: string;
  status: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  assignments: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      mobile?: string;
      avatar_path?: string;
    };
  }>;
}

function TeamMemberAvatar({ url, name }: { url: string; name: string }) {
  const [err, setErr] = useState(false);
  if (err) return <Avatar name={name} size="sm" />;
  return (
    <img
      src={url}
      alt={name}
      className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
      onError={() => setErr(true)}
    />
  );
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
      .then((res) => setProject(res.data.data))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [projectId]);

  const teamMembers = useMemo(() => {
    if (!project?.assignments) return [];
    return project.assignments.map((a) => {
      const user = a.user;
      let avatarUrl: string | null = null;
      if (user.avatar_path) {
        const fn = user.avatar_path.includes('/') ? user.avatar_path.split('/').pop()! : user.avatar_path;
        avatarUrl = `${API_BASE}/uploads/avatars/${fn}`;
      }
      return {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        mobile: user.mobile || '',
        role: a.role || 'Member',
        avatarUrl,
      };
    });
  }, [project]);

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
                Code: {project.project_code}
                {project.project_id && ` · ID: ${project.project_id}`}
              </p>
            </div>
          </div>
          <StatusBadge status={project.status as any} />
        </div>
      </motion.div>

      {/* Project Info */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[var(--text-tertiary)]" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Status</p>
                <StatusBadge status={project.status as any} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Team Size</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}</p>
              </div>
              {project.start_date && (
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Start Date</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {new Date(project.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              )}
              {project.end_date && (
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">End Date</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {new Date(project.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
            {project.description && (
              <div className="mt-4 pt-4 border-t border-[var(--border-secondary)]">
                <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-[var(--text-secondary)]">{project.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Team Members */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--text-tertiary)]" />
              Team Members
              <span className="text-xs font-normal text-[var(--text-tertiary)] ml-1">({teamMembers.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {teamMembers.map((member, i) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    {member.avatarUrl ? (
                      <TeamMemberAvatar url={member.avatarUrl} name={member.name} />
                    ) : (
                      <Avatar name={member.name} size="sm" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{member.name}</p>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 flex-shrink-0">
                          {member.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          {member.email}
                        </span>
                        {member.mobile && (
                          <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            {member.mobile}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">No team members assigned</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
