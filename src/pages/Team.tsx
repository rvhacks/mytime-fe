import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TEAM_MEMBERS } from '@/data/mockData';
import { EmptyState } from '@/components/shared/States';

export default function Team() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  const departments = [...new Set(TEAM_MEMBERS.map((m) => m.department))];

  const filtered = TEAM_MEMBERS.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'all' || m.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Team</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          View your team members and their submission status
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-[var(--bg-tertiary)] border-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="h-9 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Team Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No team members found"
          description="Try adjusting your search or filter criteria"
          action={{ label: 'Clear filters', onClick: () => { setSearch(''); setDeptFilter('all'); } }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-md transition-all duration-300 group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar name={member.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{member.name}</h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{member.designation}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{member.department}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[var(--border-secondary)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-tertiary)]">This week</span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{member.hoursThisWeek}h</span>
                    </div>
                    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (member.hoursThisWeek / 40) * 100)}%`,
                          backgroundColor: member.hoursThisWeek >= 40 ? '#10b981' : member.hoursThisWeek >= 30 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-tertiary)]">Status</span>
                      <StatusBadge status={member.submissionStatus} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
