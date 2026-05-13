import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Clock,
  BarChart3,
  FolderKanban,
  CheckSquare,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Zap,
  Settings2,
  Tag,
  Users,
  FolderOpen,
  Link2,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/avatar';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: any;
  roles: string[];
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['employee', 'admin'] },
  { path: '/timesheet', label: 'Timesheet', icon: Clock, roles: ['employee', 'admin'] },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['employee', 'admin'] },
  { path: '/projects', label: 'My Projects', icon: FolderKanban, roles: ['employee', 'admin'] },
  { path: '/approvals', label: 'Approvals', icon: CheckSquare, roles: ['admin'] },
  { path: '/profile', label: 'Profile', icon: User, roles: ['employee', 'admin'] },
];

const managementItems: NavItem[] = [
  { path: '/management/designations', label: 'Designations', icon: Tag, roles: ['admin'] },
  { path: '/management/employees', label: 'Employees', icon: Users, roles: ['admin'] },
  { path: '/management/projects', label: 'Projects', icon: FolderOpen, roles: ['admin'] },
  { path: '/management/assignments', label: 'Assignments', icon: Link2, roles: ['admin'] },
  { path: '/management/milestones', label: 'Milestones', icon: Target, roles: ['admin'] },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mgmtOpen, setMgmtOpen] = useState(() => location.pathname.startsWith('/management'));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dynamic visibility: 'manager' is no longer a static role
  const visibleItems = navItems.filter((item) => {
    if (!user) return false;
    // Special case: Approvals visible to dynamic managers and admin
    if (item.path === '/approvals') {
      return user.role === 'admin' || user.isManager;
    }
    return item.roles.includes(user.role);
  });
  const showManagement = user && user.role === 'admin';
  const isMgmtActive = location.pathname.startsWith('/management');

  const renderNavLink = (item: NavItem, indent = false) => (
    <NavLink
      key={item.path}
      to={item.path}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
          indent && !collapsed && 'ml-4',
          isActive
            ? 'bg-[var(--bg-sidebar-active)] text-[var(--text-sidebar-active)]'
            : 'text-[var(--text-sidebar)] hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-sidebar-active)]'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-500 rounded-r-full"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-brand-400')} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
        </>
      )}
    </NavLink>
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-[var(--bg-sidebar)] border-r border-white/[0.06]"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/25">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-white font-bold text-lg tracking-tight">My Time</span>
                <span className="block text-[10px] text-white/40 font-medium -mt-0.5">Crystal TS</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {visibleItems.map((item) => renderNavLink(item))}

        {/* Management Group — Admin only */}
        {showManagement && (
          <div className="mt-2">
            {!collapsed && (
              <div className="px-3 pt-3 pb-1">
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Admin</span>
              </div>
            )}
            <button
              onClick={() => { setMgmtOpen(!mgmtOpen); if (collapsed) navigate('/management/designations'); }}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isMgmtActive
                  ? 'bg-[var(--bg-sidebar-active)] text-[var(--text-sidebar-active)]'
                  : 'text-[var(--text-sidebar)] hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-sidebar-active)]'
              )}
            >
              <Settings2 className={cn('w-5 h-5 flex-shrink-0', isMgmtActive && 'text-brand-400')} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap flex-1 text-left"
                  >
                    Management
                  </motion.span>
                )}
              </AnimatePresence>
              {!collapsed && (
                <ChevronDown className={cn('w-4 h-4 transition-transform', mgmtOpen && 'rotate-180')} />
              )}
            </button>

            <AnimatePresence>
              {mgmtOpen && !collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 mt-0.5">
                    {managementItems.map((item) => renderNavLink(item, true))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      {/* User Profile & Collapse */}
      <div className="border-t border-white/[0.06] p-3 space-y-2">
        {user && (
          <div className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg',
            collapsed ? 'justify-center' : ''
          )}>
            <Avatar name={user.name} size="sm" />
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-white/40 truncate capitalize">{user.role}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.06] transition-all duration-200',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Log out
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
}
