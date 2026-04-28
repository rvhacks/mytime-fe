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
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuthStore } from '@/store/authStore';
import { RECENT_ACTIVITY, WEEKLY_TREND, HOURS_PER_PROJECT, WEEKLY_BILLABLE_TREND, BILLABLE_SUMMARY } from '@/data/mockData';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
} from 'recharts';

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
};

const BILLABLE_PIE = [
  { name: 'Billable', value: BILLABLE_SUMMARY.totalBillable, color: '#10b981' },
  { name: 'Non-Billable', value: BILLABLE_SUMMARY.totalNonBillable, color: '#f59e0b' },
];

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const summaryCards = [
    {
      title: 'Hours Logged',
      value: '36',
      subtitle: 'of 40 expected',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-brand-500',
      bg: 'bg-brand-50 dark:bg-brand-900/20',
      trend: '+4h from yesterday',
      trendUp: true,
    },
    {
      title: 'Billable Hours',
      value: '23',
      subtitle: `${Math.round((23 / 36) * 100)}% billable rate`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-accent-500',
      bg: 'bg-accent-50 dark:bg-accent-900/20',
      trend: 'On track',
      trendUp: true,
    },
    {
      title: 'Non-Billable',
      value: '13',
      subtitle: 'Internal + meetings',
      icon: <Receipt className="w-5 h-5" />,
      color: 'text-warning-500',
      bg: 'bg-warning-50 dark:bg-warning-500/10',
      trend: '+2h from last week',
      trendUp: false,
    },
    {
      title: 'Approval Rate',
      value: '92%',
      subtitle: 'Last 30 days',
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      trend: '+5% improvement',
      trendUp: true,
    },
  ];

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
            Here's your weekly overview for Apr 20 – Apr 26, 2026
          </p>
        </div>
        <button
          onClick={() => navigate('/timesheet')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all duration-200 active:scale-[0.97]"
        >
          <Send className="w-4 h-4" />
          Submit Timesheet
        </button>
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
                <p className="text-3xl font-bold text-[var(--text-primary)] mb-1">{card.value}</p>
                <p className="text-xs text-[var(--text-tertiary)] mb-2">{card.subtitle}</p>
                <div className="flex items-center gap-1">
                  <ArrowUpRight className={`w-3 h-3 ${card.trendUp ? 'text-accent-500' : 'text-warning-500 rotate-90'}`} />
                  <span className={`text-xs font-medium ${card.trendUp ? 'text-accent-500' : 'text-warning-500'}`}>
                    {card.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Hours Trend */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Hours Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={WEEKLY_TREND}>
                    <defs>
                      <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#hoursGrad)"
                      name="Logged"
                    />
                    <Area
                      type="monotone"
                      dataKey="expected"
                      stroke="#94a3b8"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      fill="none"
                      name="Expected"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hours Per Project */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hours by Project</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={HOURS_PER_PROJECT} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-tertiary)" fontSize={12} />
                    <YAxis dataKey="name" type="category" width={120} stroke="var(--text-tertiary)" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Hours">
                      {HOURS_PER_PROJECT.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Billable vs Non-Billable Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billable Trend */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Billable vs Non-Billable (Weekly)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={WEEKLY_BILLABLE_TREND}>
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
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="billable" fill="#10b981" radius={[4, 4, 0, 0]} name="Billable" stackId="a" />
                    <Bar dataKey="nonBillable" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Non-Billable" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Billable Pie */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Billable Ratio (Month-to-Date)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center">
                <div className="w-1/2">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={BILLABLE_PIE}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {BILLABLE_PIE.map((entry, index) => (
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
                    <p className="text-4xl font-bold text-[var(--text-primary)]">{BILLABLE_SUMMARY.billablePercentage}%</p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">Billable Rate</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-accent-500" />
                        <span className="text-sm text-[var(--text-secondary)]">Billable</span>
                      </div>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{BILLABLE_SUMMARY.totalBillable}h</span>
                    </div>
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-warning-500" />
                        <span className="text-sm text-[var(--text-secondary)]">Non-Billable</span>
                      </div>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{BILLABLE_SUMMARY.totalNonBillable}h</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {RECENT_ACTIVITY.map((activity, i) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] group-hover:bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] transition-colors">
                    {iconMap[activity.icon] || <Clock className="w-4 h-4" />}
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
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
