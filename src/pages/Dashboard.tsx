import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ArrowUpRight,
  Send,
  FolderPlus,
  User as UserIcon,
  DollarSign,
  Receipt,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';
import { dashboardAPI, timesheetAPI } from '@/services/api';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
} from 'recharts';

// ---------------------------------------------------------------------------
// Week date helpers (same approach as Timesheet)
// ---------------------------------------------------------------------------

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const year = sunday.getFullYear();
  return `${fmt(monday)} – ${fmt(sunday)}, ${year}`;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const { user } = useAuthStore();
  const { dashboardStats, fetchDashboardStats } = useAdminStore();
  const navigate = useNavigate();

  // Dynamic current week
  const currentWeekRange = useMemo(() => {
    const monday = getMonday(new Date());
    return formatWeekRange(monday);
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Fetch rejected entries for employee dashboard alert
  const [rejectedEntries, setRejectedEntries] = useState<any[]>([]);
  useEffect(() => {
    if (user?.role !== 'admin') {
      timesheetAPI.getRejectedEntries().then((res) => {
        setRejectedEntries(res.data.data || []);
      }).catch(() => {});
    }
  }, [user?.role]);

  const stats = dashboardStats;
  const billableRate = stats && stats.totalHoursLogged > 0 ? Math.round((stats.billableHours / stats.totalHoursLogged) * 100) : 0;

  const summaryCards = [
    {
      title: 'Hours Logged',
      value: stats ? String(Math.round(stats.totalHoursLogged)) : '—',
      subtitle: `${stats?.totalEmployees || 0} active employees`,
      icon: <Clock className="w-5 h-5" />,
      color: 'text-brand-500',
      bg: 'bg-brand-50 dark:bg-brand-900/20',
      trend: `${stats?.activeProjects || 0} active projects`,
      trendUp: true,
    },
    {
      title: 'Billable Hours',
      value: stats ? String(Math.round(stats.billableHours)) : '—',
      subtitle: `${billableRate}% billable rate`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-accent-500',
      bg: 'bg-accent-50 dark:bg-accent-900/20',
      trend: billableRate >= 70 ? 'On track' : 'Needs attention',
      trendUp: billableRate >= 70,
    },
    {
      title: 'Non-Billable',
      value: stats ? String(Math.round(stats.nonBillableHours)) : '—',
      subtitle: 'Internal + meetings',
      icon: <Receipt className="w-5 h-5" />,
      color: 'text-warning-500',
      bg: 'bg-warning-50 dark:bg-warning-500/10',
      trend: `${stats?.pendingApprovals || 0} pending approvals`,
      trendUp: false,
    },
    {
      title: 'Approval Rate',
      value: stats ? `${stats.approvalRate}%` : '—',
      subtitle: 'This month',
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      trend: stats && stats.approvalRate >= 80 ? 'Good standing' : 'Needs improvement',
      trendUp: (stats?.approvalRate || 0) >= 80,
    },
  ];

  // Billable pie (real data)
  const billablePie = stats
    ? [
        { name: 'Billable', value: Math.round(stats.billableHours), color: '#10b981' },
        { name: 'Non-Billable', value: Math.round(stats.nonBillableHours), color: '#f59e0b' },
      ]
    : [];

  const isAdmin = user?.role === 'admin';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Here's your monthly overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => navigate('/timesheet')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all duration-200 active:scale-[0.97]"
          >
            <Send className="w-4 h-4" />
            Submit Timesheet
          </button>
        )}
      </motion.div>

      {/* Rejected Timesheet Alert */}
      {!isAdmin && rejectedEntries.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/80 dark:bg-red-900/10 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  {rejectedEntries.length} Timesheet{rejectedEntries.length > 1 ? ' Entries' : ' Entry'} Rejected
                </p>
                <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-0.5">
                  Please review the rejection reasons and re-submit your timesheet.
                </p>
                <div className="mt-3 space-y-2">
                  {/* Group by week */}
                  {[...new Map(rejectedEntries.map(e => {
                    const ws = (e.timesheet?.week_start_date || '').slice(0, 10);
                    return [ws, {
                      weekStart: ws,
                      weekEnd: (e.timesheet?.week_end_date || '').slice(0, 10),
                      entries: rejectedEntries.filter(re => (re.timesheet?.week_start_date || '').slice(0, 10) === ws),
                    }];
                  })).values()].map((group: any) => (
                    <div key={group.weekStart} className="flex items-center gap-3 p-2 rounded-lg bg-red-100/50 dark:bg-red-900/20">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-red-700 dark:text-red-400">
                          Week: {new Date(group.weekStart + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(group.weekEnd + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {group.entries.map((e: any) => (
                            <span key={e.id} className="text-[10px] text-red-600 dark:text-red-300" title={e.review_comments}>
                              {e.project?.name}: <em>{e.review_comments || 'No reason'}</em>
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          // Dismiss this week's alert
                          setRejectedEntries(prev => prev.filter(e => (e.timesheet?.week_start_date || '').slice(0, 10) !== group.weekStart));
                          navigate(`/timesheet?weekStart=${group.weekStart}`);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shrink-0"
                      >
                        View Timesheet
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div key={card.title} variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow duration-300 group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">{card.title}</span>
                  <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    {card.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{card.value}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{card.subtitle}</p>
                <div className="flex items-center gap-1 mt-2">
                  {card.trendUp ? (
                    <ArrowUpRight className="w-3 h-3 text-accent-500" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-warning-500" />
                  )}
                  <span className={`text-xs font-medium ${card.trendUp ? 'text-accent-500' : 'text-warning-500'}`}>
                    {card.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Billable Ratio Chart */}
      {billablePie.length > 0 && billablePie.some((d) => d.value > 0) && (
        <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-2' : ''} gap-6`}>
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Billable Ratio (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center">
                  <div className="w-1/2">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={billablePie}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {billablePie.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--card-bg)',
                            border: '1px solid var(--card-border)',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 space-y-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-[var(--text-primary)]">{billableRate}%</p>
                      <p className="text-sm text-[var(--text-tertiary)] mt-1">Billable Rate</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-accent-500" />
                          <span className="text-sm text-[var(--text-secondary)]">Billable</span>
                        </div>
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{Math.round(stats?.billableHours || 0)}h</span>
                      </div>
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-warning-500" />
                          <span className="text-sm text-[var(--text-secondary)]">Non-Billable</span>
                        </div>
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{Math.round(stats?.nonBillableHours || 0)}h</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Organization Overview — ADMIN ONLY */}
          {isAdmin && (
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-base">Organization Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] text-center">
                      <p className="text-2xl font-bold text-brand-500">{stats?.totalEmployees || 0}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">Active Employees</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] text-center">
                      <p className="text-2xl font-bold text-accent-500">{stats?.activeProjects || 0}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">Active Projects</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] text-center">
                      <p className="text-2xl font-bold text-purple-500">{Math.round(stats?.totalHoursLogged || 0)}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">Hours This Month</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] text-center">
                      <p className="text-2xl font-bold text-warning-500">{stats?.pendingApprovals || 0}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">Pending Approvals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

    </motion.div>
  );
}
