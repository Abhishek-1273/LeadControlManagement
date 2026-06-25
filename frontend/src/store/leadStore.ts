import { create } from 'zustand';
import { Lead, LeadFilters, LeadStatus } from '../types/lead.types';
import axiosInstance from '../api/axiosInstance';

export interface CreateLeadPayload {
  name: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  city?: string;
  source?: string;
  campaign?: string;
  car?: string;
  assignedTo?: string;
  status?: LeadStatus;
}

interface DashboardStats {
  totalLeads: number;
  newToday: number;
  interested: number;
  contacted: number;
  notInterested: number;
  followUp: number;
  booked: number;
  conversionRate: number;
  todayFollowUps: number;
  pending: number;
  // New employee-specific fields
  todayLeadsCount: number;
  previousPendingCount: number;
  bookedToday: number;
  monthLeadsCount: number;
}

interface LeadStore {
  leads: Lead[];
  todayLeads: Lead[];
  pendingLeads: Lead[];
  bookedLeads: Lead[];
  archiveLeads: Lead[];
  selectedLead: Lead | null;
  followUps: any[];
  stats: DashboardStats;
  isLoading: boolean;
  error: string | null;

  fetchLeads: (filters?: LeadFilters) => Promise<void>;
  fetchLeadById: (id: string) => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  fetchTodayFollowUps: () => Promise<void>;
  fetchEmployeeTodayLeads: () => Promise<void>;
  fetchEmployeePendingLeads: () => Promise<void>;
  fetchEmployeeBookedLeads: (scope?: 'today' | 'all') => Promise<void>;
  createLead: (data: CreateLeadPayload) => Promise<void>;
  updateStatus: (id: string, status: string) => Promise<void>;
  addNote: (id: string, note: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  updateLeadInfo: (id: string, data: any) => Promise<void>;
  clearSelectedLead: () => void;
  softDeleteLead: (id: string) => Promise<void>;
  restoreLead: (id: string) => Promise<void>;
  fetchEmployeeArchive: (filters?: { status?: string; search?: string }) => Promise<void>;
  fetchLeadAppointment: (id: string) => Promise<any>;
}

export const useLeadStore = create<LeadStore>((set, get) => ({
  leads: [],
  todayLeads: [],
  pendingLeads: [],
  bookedLeads: [],
  archiveLeads: [],
  selectedLead: null,
  followUps: [],
  stats: {
    totalLeads: 0,
    newToday: 0,
    interested: 0,
    contacted: 0,
    notInterested: 0,
    followUp: 0,
    booked: 0,
    conversionRate: 0,
    todayFollowUps: 0,
    pending: 0,
    todayLeadsCount: 0,
    previousPendingCount: 0,
    bookedToday: 0,
    monthLeadsCount: 0,
  },
  isLoading: false,
  error: null,

  fetchLeads: async (filters) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if ((filters as any)?.dateFrom) params.append('dateFrom', (filters as any).dateFrom);
      if ((filters as any)?.dateTo) params.append('dateTo', (filters as any).dateTo);
      const res = await axiosInstance.get(`/leads?${params.toString()}`);
      set({ leads: res.data.leads || [], isLoading: false });
    } catch (err: any) {
      console.error('fetchLeads error:', err.message);
      set({ error: err.message, isLoading: false, leads: [] });
    }
  },

  fetchLeadById: async (id) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/leads/${id}`);
      set({ selectedLead: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchDashboardStats: async () => {
    try {
      const res = await axiosInstance.get('/leads/dashboard');
      set({
        stats: {
          totalLeads: res.data.totalLeads ?? 0,
          newToday: res.data.newToday ?? res.data.todayLeadsCount ?? 0,
          interested: res.data.interested ?? 0,
          contacted: res.data.contacted ?? 0,
          notInterested: res.data.notInterested ?? 0,
          followUp: res.data.followUp ?? 0,
          booked: res.data.booked ?? 0,
          conversionRate: res.data.conversionRate ?? 0,
          todayFollowUps: res.data.todayFollowUps ?? 0,
          pending: res.data.pending ?? 0,
          todayLeadsCount: res.data.todayLeadsCount ?? 0,
          previousPendingCount: res.data.previousPendingCount ?? 0,
          bookedToday: res.data.bookedToday ?? 0,
          monthLeadsCount: res.data.monthLeadsCount ?? 0,
        },
      });
    } catch (err: any) {
      console.error('fetchDashboardStats error:', err.message);
    }
  },

  fetchEmployeeTodayLeads: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get('/leads/employee-today');
      set({ todayLeads: res.data.leads || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchEmployeePendingLeads: async () => {
    try {
      const res = await axiosInstance.get('/leads/employee-pending');
      set({ pendingLeads: res.data.leads || [] });
    } catch (err: any) {
      console.error(
        'fetchEmployeePendingLeads error:',
        err.response?.status,
        err.response?.data?.message || err.message
      );
    }
  },

  fetchEmployeeBookedLeads: async (scope = 'today') => {
    try {
      const res = await axiosInstance.get(`/leads/employee-booked?scope=${scope}`);
      set({ bookedLeads: res.data.leads || [] });
    } catch (err: any) {
      console.error(
        'fetchEmployeeBookedLeads error:',
        err.response?.status,
        err.response?.data?.message || err.message
      );
    }
  },

  createLead: async (data: CreateLeadPayload) => {
    const res = await axiosInstance.post('/leads', data);
    set((state) => ({ leads: [res.data.lead, ...state.leads] }));
  },

  fetchTodayFollowUps: async () => {
    try {
      const res = await axiosInstance.get('/leads/followups/today');
      set({ followUps: res.data.followUps || [] });
    } catch (err: any) {
      console.error('fetchTodayFollowUps error:', err.message);
    }
  },

  updateStatus: async (id, status) => {
    try {
      await axiosInstance.patch(`/leads/${id}/status`, { status });
      const leads = get().leads.map((l) =>
        l._id === id ? { ...l, status: status as any } : l
      );
      set({ leads });
      if (get().selectedLead?._id === id) {
        set({ selectedLead: { ...get().selectedLead!, status: status as any } });
      }
    } catch (err: any) {
      throw err;
    }
  },

  addNote: async (id, note) => {
    try {
      await axiosInstance.patch(`/leads/${id}/note`, { note });
      await get().fetchLeadById(id);
    } catch (err: any) {
      throw err;
    }
  },

  togglePin: async (id) => {
    try {
      const res = await axiosInstance.patch(`/leads/${id}/pin`);
      const leads = get().leads.map((l) =>
        l._id === id ? { ...l, isPinned: res.data.isPinned } : l
      );
      const selectedLead = get().selectedLead;
      set({
        leads,
        selectedLead: selectedLead?._id === id
          ? { ...selectedLead, isPinned: res.data.isPinned }
          : selectedLead,
      });
    } catch (err: any) {
      throw err;
    }
  },

  updateLeadInfo: async (id, data) => {
    try {
      await axiosInstance.patch(`/leads/${id}/info`, data);
      await get().fetchLeadById(id);
    } catch (err: any) {
      throw err;
    }
  },

  clearSelectedLead: () => set({ selectedLead: null }),

  softDeleteLead: async (id) => {
    try {
      await axiosInstance.patch(`/leads/${id}/soft-delete`);
      // Remove from active leads list
      const leads = get().leads.filter((l) => l._id !== id);
      set({ leads });
      // Update selectedLead if it's the one being deleted
      if (get().selectedLead?._id === id) {
        set({ selectedLead: { ...get().selectedLead!, isDeleted: true } as any });
      }
    } catch (err: any) {
      throw err;
    }
  },

  restoreLead: async (id) => {
    try {
      const res = await axiosInstance.patch(`/leads/${id}/restore`);
      // Update in archive list
      const archiveLeads = get().archiveLeads.map((l) =>
        l._id === id ? { ...l, isDeleted: false } : l
      );
      set({ archiveLeads });
      if (get().selectedLead?._id === id) {
        set({ selectedLead: res.data.lead });
      }
    } catch (err: any) {
      throw err;
    }
  },

  fetchEmployeeArchive: async (filters) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      const res = await axiosInstance.get(`/leads/employee-archive?${params.toString()}`);
      set({ archiveLeads: res.data.leads || [], isLoading: false });
    } catch (err: any) {
      console.error('fetchEmployeeArchive error:', err.message);
      set({ error: err.message, isLoading: false, archiveLeads: [] });
    }
  },

  fetchLeadAppointment: async (id) => {
    try {
      const res = await axiosInstance.get(`/leads/${id}/appointment`);
      return res.data.appointment;
    } catch {
      return null;
    }
  },
}));