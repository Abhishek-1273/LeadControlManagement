import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';
import { endpoints } from '../api/endpoints';

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  isRead: boolean;
  broadcast: boolean;
  createdAt: string;
}

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  sendNotification: (data: {
    title: string;
    message: string;
    type?: string;
    target: string; // 'all' or a userId
  }) => Promise<{ count: number }>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get(endpoints.notifications);
      set({
        notifications: res.data.notifications || [],
        unreadCount: res.data.unreadCount || 0,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to load', isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await axiosInstance.get(endpoints.notificationsUnread);
      set({ unreadCount: res.data.unreadCount || 0 });
    } catch {
      // silent — badge count is non-critical
    }
  },

  markAsRead: async (id) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    try {
      await axiosInstance.patch(endpoints.notificationRead(id));
    } catch {
      // re-sync on failure
      get().fetchNotifications();
    }
  },

  markAllRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await axiosInstance.patch(endpoints.notificationsReadAll);
    } catch {
      get().fetchNotifications();
    }
  },

  deleteNotification: async (id) => {
    const removed = get().notifications.find((n) => n._id === id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n._id !== id),
      unreadCount:
        removed && !removed.isRead
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
    }));
    try {
      await axiosInstance.delete(endpoints.notificationDelete(id));
    } catch {
      get().fetchNotifications();
    }
  },

  sendNotification: async (data) => {
    const res = await axiosInstance.post(endpoints.sendNotification, data);
    return { count: res.data.count || 0 };
  },
}));
