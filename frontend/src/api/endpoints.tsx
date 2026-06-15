export const endpoints = {
  // Auth
  login: '/auth/login',
  logout: '/auth/logout',
  refreshToken: '/auth/refresh',
  forgotPassword: '/auth/forgot-password',
  changePassword: '/auth/change-password',

  // Notifications
  notifications: '/notifications',
  notificationsUnread: '/notifications/unread-count',
  notificationsReadAll: '/notifications/read-all',
  notificationRead: (id: string) => `/notifications/${id}/read`,
  notificationDelete: (id: string) => `/notifications/${id}`,
  sendNotification: '/notifications/send',

  // Leads
  leads: '/leads',
  leadDetail: (id: string) => `/leads/${id}`,
  leadStatus: (id: string) => `/leads/${id}/status`,
  leadNotes: (id: string) => `/leads/${id}/notes`,
  leadFollowUps: (id: string) => `/leads/${id}/followups`,
  leadTimeline: (id: string) => `/leads/${id}/timeline`,
  pinLead: (id: string) => `/leads/${id}/pin`,

  // Employee
  profile: '/employee/profile',
  dashboard: '/employee/dashboard',
};
