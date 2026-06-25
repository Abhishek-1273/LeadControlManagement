import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';
import { Appointment } from '../types/lead.types';

interface Employee {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  totalLeads?: number;
}

export interface EmployeePerformance {
  employee: {
    _id: string;
    name: string;
    email: string;
    isActive: boolean;
  };
  assignedToday: number;
  bookedToday: number;
  previousPending: number;
  totalAssigned: number;
  totalBooked: number;
  weeklyBooked: number;
  monthlyBooked: number;
  conversionRate: number;
}

interface AdminStats {
  monthLeads: number;
  todayLeads: number;
  interested: number;
  contacted: number;
  notInterested: number;
  followUp: number;
  booked: number;
  allBooked: number;
  activeEmployees: number;
  conversionRate: number;
  appointmentsToday: number;
  pendingLeads: number;
}

export interface MonthlyTrendPoint {
  label: string; // e.g. 'Jul'
  year: number;
  count: number;
}

interface AdminStore {
  employees: Employee[];
  selectedEmployee: Employee | null;
  stats: AdminStats;
  performanceData: EmployeePerformance[];
  monthlyTrend: MonthlyTrendPoint[];
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  isLoading: boolean;
  error: string | null;

  fetchEmployees: () => Promise<void>;
  fetchEmployeeById: (id: string) => Promise<void>;
  addEmployee: (data: any) => Promise<void>;
  updateEmployee: (id: string, data: any) => Promise<void>;
  toggleEmployeeStatus: (id: string) => Promise<void>;
  fetchAdminStats: () => Promise<void>;
  fetchPerformanceDashboard: () => Promise<void>;
  fetchMonthlyTrend: () => Promise<void>;
  assignLead: (leadId: string, employeeId: string) => Promise<void>;
  fetchAllLeads: (filters?: Record<string, string>) => Promise<{ leads: any[]; total: number }>;

  // Appointments
  fetchAppointments: () => Promise<void>;
  fetchAppointmentById: (id: string) => Promise<void>;
  updateAppointment: (id: string, data: any) => Promise<void>;
  setAppointmentStatus: (id: string, status: 'scheduled' | 'completed' | 'missed') => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  employees: [],
  selectedEmployee: null,
  stats: {
    monthLeads: 0, todayLeads: 0, interested: 0,
    contacted: 0, notInterested: 0, followUp: 0, booked: 0, allBooked: 0,
    activeEmployees: 0, conversionRate: 0,
    appointmentsToday: 0, pendingLeads: 0,
  },
  performanceData: [],
  monthlyTrend: [],
  appointments: [],
  selectedAppointment: null,
  isLoading: false,
  error: null,

  fetchEmployees: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get('/admin/employees');
      set({ employees: res.data.employees || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchEmployeeById: async (id) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/admin/employees/${id}`);
      set({ selectedEmployee: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addEmployee: async (data) => {
    try {
      await axiosInstance.post('/admin/employees', data);
      await get().fetchEmployees();
    } catch (err: any) {
      throw err;
    }
  },

  updateEmployee: async (id, data) => {
    try {
      await axiosInstance.patch(`/admin/employees/${id}`, data);
      await get().fetchEmployees();
    } catch (err: any) {
      throw err;
    }
  },

  toggleEmployeeStatus: async (id) => {
    try {
      await axiosInstance.patch(`/admin/employees/${id}/toggle`);
      await get().fetchEmployees();
    } catch (err: any) {
      throw err;
    }
  },

  fetchAdminStats: async () => {
    try {
      const res = await axiosInstance.get('/admin/stats');
      set({ stats: res.data });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchPerformanceDashboard: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get('/admin/performance');
      set({ performanceData: res.data.performance || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchMonthlyTrend: async () => {
    try {
      const res = await axiosInstance.get('/admin/monthly-trend');
      set({ monthlyTrend: res.data.trend || [] });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  assignLead: async (leadId, employeeId) => {
    try {
      await axiosInstance.patch(`/admin/leads/${leadId}/assign`, { employeeId });
    } catch (err: any) {
      throw err;
    }
  },

  fetchAllLeads: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters as any);
      const res = await axiosInstance.get(`/admin/leads?${params.toString()}`);
      return { leads: res.data.leads || [], total: res.data.total || 0 };
    } catch (err: any) {
      throw err;
    }
  },

  // ─── Appointments ──────────────────────────────────────
  fetchAppointments: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get('/admin/appointments');
      set({ appointments: res.data.appointments || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchAppointmentById: async (id) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/admin/appointments/${id}`);
      set({ selectedAppointment: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateAppointment: async (id, data) => {
    try {
      await axiosInstance.patch(`/admin/appointments/${id}`, data);
      await get().fetchAppointments();
    } catch (err: any) {
      throw err;
    }
  },

  setAppointmentStatus: async (id, status) => {
    try {
      await axiosInstance.patch(`/admin/appointments/${id}/status`, { status });
      await get().fetchAppointments();
    } catch (err: any) {
      throw err;
    }
  },

}));