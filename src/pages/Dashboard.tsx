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
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';
import { dashboardAPI } from '@/services/api';
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

const iconMap: Record<string, React.ReactNode> = {
  send: <Send className="w-4 h-4" />,
  clock: <Clock className="w-4 h-4" />,
  'check-circle': <CheckCircle2 className="w-4 h-4" />,
  'folder-plus': <FolderPlus className="w-4 h-4" />,
  user: <UserIcon className="w-4 h-4" />,
  timesheet: <Send className="w-4 h-4" />,
  project: <FolderPlus className="w-4 h-4" />,
  employee: <UserIcon className="w-4 h-4" />,
};

// ---------------------------------------------------------------------------
// Activity type
// ---------------------------------------------------------------------------

interface Activity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  type: string;
  category: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const { user } = useAuthStore();
  const { dashboardStats, fetchDashboardStats } = useAdminStore();
  const navigate = useNavigate();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Dynamic current week
  const currentWeekRange = useMemo(() => {
    const monday = getMonday(new Date());
    return formatWeekRange(monday);
  }, []);

  useEffect(() => {
    fetchDashboardStats();
    // Fetch recent activity from backend
    setActivitiesLoading(true);
    dashboardAPI.getActivity()
      .then((res) => {
        setActivities(res.data.data || []);
      })
      .catch(() => setActivities([]))
      .finally(() => setActivitiesLoading(false));
  }, [fetchDashboardStats]);

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
      subtitle: 'Last 30 days',
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
            Here's your weekly overview for {currentWeekRange}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Quick Stats */}
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
        </div>
      )}

      {/* Recent Activity (API-driven) */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">No recent activity yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activities.map((activity, i) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] group-hover:bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] transition-colors">
                      {iconMap[activity.category] || iconMap[activity.type] || <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{activity.action}</p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate">{activity.description}</p>
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap">
                      {new Date(activity.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
