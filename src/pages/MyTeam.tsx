import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, UserCheck, Loader2, Search, Filter, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { userAPI } from '@/services/api';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

function buildAvatarSrc(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  // Relative URL like /uploads/avatars/xxx.jpg
  return `${API_BASE}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
}

interface TeamMember {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  mobile: string;
  avatarUrl: string | null;
  designation: string;
  isDirectReport: boolean;
}

interface ProjectOption {
  id: string;
  name: string;
  code: string;
}

export default function MyTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    userAPI.getMyTeam()
      .then((res) => {
        setMembers(res.data.data?.members || []);
        setProjects(res.data.data?.projects || []);
      })
      .catch((err: any) => {
        toast.error(err.response?.data?.message || 'Failed to load team');
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter members based on search and project
  // Note: project filter would need backend support to filter by project assignment
  // For now we filter by name locally
  const filteredMembers = useMemo(() => {
    let filtered = members;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.designation?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [members, search]);

  const directReports = filteredMembers.filter(m => m.isDirectReport);
  const projectTeammates = filteredMembers.filter(m => !m.isDirectReport);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const MemberCard = ({ member, index }: { member: TeamMember; index: number }) => {
    const src = buildAvatarSrc(member.avatarUrl);
    const [imgError, setImgError] = useState(false);
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
      >
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {src && !imgError ? (
                <img
                  src={src}
                  alt={member.name}
                  className="w-12 h-12 rounded-xl object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <Avatar name={member.name} size="md" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{member.name}</p>
                {member.designation && (
                  <p className="text-xs text-[var(--text-secondary)] truncate">{member.designation}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-brand-500 transition-colors truncate"
                    title={member.email}
                  >
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </a>
                  {member.mobile && (
                    <a
                      href={`tel:${member.mobile}`}
                      className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-brand-500 transition-colors"
                    >
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      {member.mobile}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Toaster position="top-right" />

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Team</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          {members.length} team member{members.length !== 1 ? 's' : ''} across your projects
          {directReports.length > 0 && ` · ${directReports.length} direct report${directReports.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search by name, email, or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
          />
        </div>

        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="h-10 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] text-sm text-[var(--text-primary)] px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-brand-500/30 appearance-none"
              style={{ minWidth: 180 }}
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {(search || projectFilter) && (
          <button
            onClick={() => { setSearch(''); setProjectFilter(''); }}
            className="h-10 px-3 flex items-center gap-1 rounded-xl text-xs font-medium text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-3" />
            <p className="text-lg font-medium text-[var(--text-secondary)]">
              {search || projectFilter ? 'No matching team members' : 'No team members found'}
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              {search || projectFilter
                ? 'Try adjusting your search or filter'
                : "You will see teammates here once you're assigned to projects"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Direct Reports Section */}
          {directReports.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Direct Reports
                  <span className="text-[var(--text-tertiary)] font-normal ml-1.5">({directReports.length})</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {directReports.map((member, i) => (
                  <MemberCard key={member.id} member={member} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Project Teammates Section */}
          {projectTeammates.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-brand-500" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Project Teammates
                  <span className="text-[var(--text-tertiary)] font-normal ml-1.5">({projectTeammates.length})</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectTeammates.map((member, i) => (
                  <MemberCard key={member.id} member={member} index={i} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
