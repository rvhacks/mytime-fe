import { create } from 'zustand';
import type { Notification } from '@/types';
import { notificationAPI } from '@/services/api';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

function mapNotification(n: any): Notification {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type || 'info',
    category: n.category || 'general',
    read: n.read || false,
    createdAt: n.created_at || n.createdAt || '',
  };
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await notificationAPI.getAll({ limit: 50 });
      const rows = res.data.data?.rows || [];
      set({
        notifications: rows.map(mapNotification),
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await notificationAPI.getUnreadCount();
      set({ unreadCount: res.data.data?.count || 0 });
    } catch { /* silent */ }
  },

  markAsRead: async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      set((state) => {
        const notifications = state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        return {
          notifications,
          unreadCount: notifications.filter((n) => !n.read).length,
        };
      });
    } catch { /* silent */ }
  },

  markAllAsRead: async () => {
    try {
      await notificationAPI.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch { /* silent */ }
  },
}));
