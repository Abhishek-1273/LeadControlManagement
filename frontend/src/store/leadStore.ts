import { create } from 'zustand';
import { Lead, LeadFilters } from '../types/lead.types';
import axiosInstance from '../api/axiosInstance';

// Single source of truth for the create-lead payload — includes assignedTo
// so Admin's "Assign to Employee" picker actually reaches the backend.
export interface CreateLeadPayload {
  name: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  city?: string;
  source?: string;
  campaign?: string;
  car?: string;
  assignedTo?: string;   // employee _id — admin only
}

interface DashboardStats {
  totalLeads: number;
  newToday: number;
  hot: number;
  warm: number;
  cold: number;
  followUp: number;
  booked: number;
  todayFollowUps: number;
  pending: number;
}

interface LeadStore {
  leads: Lead[];
  selectedLead: Lead | null;
  followUps: any[];
  stats: DashboardStats;
  isLoading: boolean;
  error: string | null;

  fetchLeads: (filters?: LeadFilters) => Promise<void>;
  fetchLeadById: (id: string) => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  fetchTodayFollowUps: () => Promise<void>;
  createLead: (data: CreateLeadPayload) => Promise<void>;
  updateStatus: (id: string, status: string) => Promise<void>;
  addNote: (id: string, note: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  updateLeadInfo: (id: string, data: any) => Promise<void>;
  clearSelectedLead: () => void;
}

export const useLeadStore = create<LeadStore>((set, get) => ({
  leads: [],
  selectedLead: null,
  followUps: [],
  stats: {
    totalLeads: 0,
    newToday: 0,
    hot: 0,
    warm: 0,
    cold: 0,
    followUp: 0,
    booked: 0,
    todayFollowUps: 0,
    pending: 0,
  },
  isLoading: false,
  error: null,

  fetchLeads: async (filters) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
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
          newToday: res.data.newToday ?? 0,
          hot: res.data.hot ?? 0,
          warm: res.data.warm ?? 0,
          cold: res.data.cold ?? 0,
          followUp: res.data.followUp ?? 0,
          booked: res.data.booked ?? 0,
          todayFollowUps: res.data.todayFollowUps ?? 0,
          pending: res.data.pending ?? 0,
        },
      });
    } catch (err: any) {
      console.error('fetchDashboardStats error:', err.message);
    }
  },

  // Manual lead creation — assignedTo (when provided by Admin) flows straight
  // through to the backend now that CreateLeadPayload only has one definition.
  createLead: async (data: CreateLeadPayload) => {
    const res = await axiosInstance.post('/leads', data);
    // Prepend the newly created (and now-populated) lead to the local list
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
}));
