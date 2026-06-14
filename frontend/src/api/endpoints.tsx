export const endpoints = {
  // Auth
  login: '/auth/login',
  logout: '/auth/logout',
  refreshToken: '/auth/refresh',
  forgotPassword: '/auth/forgot-password',

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