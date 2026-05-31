import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  Lock,
  ChevronDown,
  Eye,
  EyeOff,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { userAPI } from '@/services/api';
import { Avatar } from '@/components/ui/avatar';
import { buildAvatarUrl } from '@/lib/avatarUtils';
import { Badge } from '@/components/ui/badge';
import toast, { Toaster } from 'react-hot-toast';

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Good morning', emoji: '👋' };
  if (hour >= 12 && hour < 17) return { text: 'Good afternoon', emoji: '☀️' };
  return { text: 'Good evening', emoji: '🌙' };
}

export function Topbar() {
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications, fetchUnreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const greeting = getGreeting();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <>
      <Toaster position="top-right" />
      <header className="sticky top-0 z-30 h-16 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-secondary)] flex items-center justify-between px-6">
        {/* Left: Greeting */}
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            {greeting.text}, {user?.name?.split(' ')[0]} {greeting.emoji}
          </h2>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="relative h-9 w-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200"
            id="theme-toggle"
          >
            <AnimatePresence mode="wait">
              {theme === 'light' ? (
                <motion.div key="moon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Moon className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div key="sun" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Sun className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative h-9 w-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200"
              id="notifications-btn"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-secondary)]">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-brand-500 hover:text-brand-600 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[var(--text-tertiary)]">No notifications yet</div>
                    ) : (
                      notifications.slice(0, 5).map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={cn(
                            'w-full text-left px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors border-b border-[var(--border-secondary)] last:border-0',
                            !notif.read && 'bg-brand-50/50 dark:bg-brand-900/10'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                              notif.type === 'success' ? 'bg-accent-500' :
                              notif.type === 'error' ? 'bg-danger-500' :
                              notif.type === 'warning' ? 'bg-warning-500' :
                              'bg-brand-500'
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{notif.title}</p>
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{notif.message}</p>
                              <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{getTimeAgo(notif.createdAt)}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div ref={userRef} className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-all duration-200"
              id="user-menu-btn"
            >
              {user && <Avatar src={buildAvatarUrl(user.avatar)} name={user.name} size="sm" />}
              <ChevronDown className="w-3 h-3 text-[var(--text-tertiary)]" />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xl overflow-hidden"
                >
                  {user && (
                    <div className="px-4 py-3 border-b border-[var(--border-secondary)]">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{user.name}</p>
                      <p className="text-xs text-[var(--text-secondary)] capitalize">{user.role} • {user.designation}</p>
                    </div>
                  )}
                  <div className="py-1">
                    <button
                      onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <button
                      onClick={() => { setChangePwOpen(true); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <Lock className="w-4 h-4" /> Change Password
                    </button>
                    <div className="border-t border-[var(--border-secondary)] my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      <AnimatePresence>
        {changePwOpen && <ChangePasswordModal onClose={() => setChangePwOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------
// Change Password Modal
// ---------------------------------------------------------------------------

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword.trim()) { toast.error('Current password is required'); return; }
    if (newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      await userAPI.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Change Password</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              placeholder="Re-enter new password"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-[var(--input-border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Change Password
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
