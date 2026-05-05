import { create } from 'zustand';
import type { Notification } from '@/types';

// Inline initial notifications (no backend endpoint for this yet)
const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Timesheet Approved', message: 'Your timesheet for Apr 13-19 has been approved.', type: 'success', read: false, createdAt: '2026-04-20T09:00:00Z' },
  { id: 'n2', title: 'Submission Reminder', message: "Don't forget to submit your timesheet by Friday 5:00 PM.", type: 'warning', read: false, createdAt: '2026-04-24T08:00:00Z' },
  { id: 'n3', title: 'New Project Assignment', message: 'You have been assigned to Phoenix Platform.', type: 'info', read: true, createdAt: '2026-04-15T10:00:00Z' },
];

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: INITIAL_NOTIFICATIONS,
  unreadCount: INITIAL_NOTIFICATIONS.filter((n) => !n.read).length,

  markAsRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  addNotification: (notification) =>
    set((state) => {
      const newNotification: Notification = {
        ...notification,
        id: `n${Date.now()}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      return {
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    }),
}));
