// Centralised API paths. Only endpoints that exist on the backend and are
// actually consumed live here — stale/aspirational routes were removed to
// avoid 404s and confusion. Most stores call axios with literal paths.
export const endpoints = {
  // Auth
  changePassword: '/auth/change-password',

  // Notifications
  notifications: '/notifications',
  notificationsUnread: '/notifications/unread-count',
  notificationsReadAll: '/notifications/read-all',
  notificationRead: (id: string) => `/notifications/${id}/read`,
  notificationDelete: (id: string) => `/notifications/${id}`,
  sendNotification: '/notifications/send',
};