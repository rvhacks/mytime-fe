import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Shield,
  FolderKanban,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useAdminStore } from '@/store/adminStore';
import { TEAM_MEMBERS } from '@/data/mockData';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function ProjectTeam() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects } = useAdminStore();

  const project = projects.find((p) => p.id === projectId);

  const teamMembers = useMemo(() => {
    if (!project) return [];
    return TEAM_MEMBERS.filter((m) => project.assignedEmployees.includes(m.id));
  }, [project]);

  if (!project) {
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
          onClick={() => navigate(`/projects/${projectId}`)}
          className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {project.name}
        </button>

        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-lg flex-shrink-0"
            style={{ backgroundColor: project.color, boxShadow: `0 8px 24px ${project.color}40` }}
          >
            {project.code.slice(0, 2)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Team Members</h1>
            <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
              {project.name} · {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {teamMembers.map((member, i) => (
          <motion.div key={member.id} variants={itemVariants}>
            <Card className="hover:shadow-lg transition-all duration-300 group overflow-hidden h-full">
              {/* Top accent bar */}
              <div className="h-1" style={{ backgroundColor: project.color }} />
              <CardContent className="p-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4 mb-5">
                  <Avatar name={member.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-[var(--text-primary)] truncate group-hover:text-brand-500 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] truncate">{member.designation}</p>
                    <span
                      className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        member.status === 'active'
                          ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="space-y-3 pt-4 border-t border-[var(--border-secondary)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-brand-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">Role</p>
                      <p className="text-sm text-[var(--text-primary)] capitalize">{member.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">Department</p>
                      <p className="text-sm text-[var(--text-primary)]">{member.department}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-accent-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">Email</p>
                      <a
                        href={`mailto:${member.email}`}
                        className="text-sm text-brand-500 hover:text-brand-600 truncate block transition-colors"
                      >
                        {member.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-warning-50 dark:bg-warning-500/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-warning-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">Phone</p>
                      <a
                        href={`tel:${member.phone}`}
                        className="text-sm text-[var(--text-primary)] hover:text-brand-500 transition-colors"
                      >
                        {member.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
