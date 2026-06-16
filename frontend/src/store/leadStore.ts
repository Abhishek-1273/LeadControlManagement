import { create } from 'zustand';
import { Lead, LeadFilters } from '../types/lead.types';
import axiosInstance from '../api/axiosInstance';

interface DashboardStats {
  totalLeads: number;
  newToday: number;
  interested: number;
  booked: number;
  contacted: number;
  followUp: number;
  visitor: number;
  uninterested: number;
  noResponse: number;
  todayFollowUps: number;
  pending: number;
}

interface LeadStore {
  leads: Lead[];
  selectedLead: Lead | null;
  followUps: any[];          // ✅ Today's follow-ups
  stats: DashboardStats;
  isLoading: boolean;
  error: string | null;

  fetchLeads: (filters?: LeadFilters) => Promise<void>;
  fetchLeadById: (id: string) => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  fetchTodayFollowUps: () => Promise<void>;  // ✅
  updateStatus: (id: string, status: string) => Promise<void>;
  addNote: (id: string, note: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  updateLeadInfo: (id: string, data: any) => Promise<void>; // ✅
  completeFollowUp: (followUpId: string) => Promise<void>;
  clearSelectedLead: () => void;
}

export const useLeadStore = create<LeadStore>((set, get) => ({
  leads: [],
  selectedLead: null,
  followUps: [],             // ✅
  stats: {
    totalLeads: 0,
    newToday: 0,
    interested: 0,
    booked: 0,
    contacted: 0,
    followUp: 0,
    visitor: 0,
    uninterested: 0,
    noResponse: 0,
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
    set({ isLoading: true, selectedLead: null });
    try {
      const res = await axiosInstance.get(`/leads/${id}`);
      set({ selectedLead: res.data, isLoading: false });
    } catch (err: any) {
      console.error('fetchLeadById error:', err.message);
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
          interested: res.data.interested ?? 0,
          booked: res.data.booked ?? 0,
          contacted: res.data.contacted ?? 0,
          followUp: res.data.followUp ?? 0,
          visitor: res.data.visitor ?? 0,
          uninterested: res.data.uninterested ?? 0,
          noResponse: res.data.noResponse ?? 0,
          todayFollowUps: res.data.todayFollowUps ?? 0,
          pending: res.data.pending ?? 0,
        }
      });
    } catch (err: any) {
      console.error('fetchDashboardStats error:', err.message);
    }
  },

  // ✅ Today's follow-ups fetch
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
        set({
          selectedLead: { ...get().selectedLead!, status: status as any }
        });
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
      if (selectedLead?._id === id) {
        set({
          selectedLead: { ...selectedLead, isPinned: res.data.isPinned }
        });
      }
      set({ leads });
    } catch (err: any) {
      throw err;
    }
  },

  // ✅ Lead info update
  updateLeadInfo: async (id, data) => {
    try {
      await axiosInstance.patch(`/leads/${id}/info`, data);
      await get().fetchLeadById(id);
    } catch (err: any) {
      throw err;
    }
  },

  completeFollowUp: async (followUpId) => {
    await axiosInstance.patch(`/leads/followup/${followUpId}/complete`);
    // Refresh today's follow-ups
    await get().fetchTodayFollowUps();
  },

  clearSelectedLead: () => set({ selectedLead: null }),
}));