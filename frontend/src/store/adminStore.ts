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

interface AdminStats {
  totalLeads: number;
  todayLeads: number;
  hot: number;
  warm: number;
  cold: number;
  followUp: number;
  booked: number;
  totalEmployees: number;
}

interface AdminStore {
  employees: Employee[];
  selectedEmployee: Employee | null;
  stats: AdminStats;
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
  assignLead: (leadId: string, employeeId: string) => Promise<void>;

  // Appointments
  fetchAppointments: () => Promise<void>;
  fetchAppointmentById: (id: string) => Promise<void>;
  createAppointment: (data: { leadId: string; appointmentDate: string; appointmentTime: string; description?: string }) => Promise<void>;
  updateAppointment: (id: string, data: any) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  employees: [],
  selectedEmployee: null,
  stats: {
    totalLeads: 0, todayLeads: 0, hot: 0,
    warm: 0, cold: 0, followUp: 0, booked: 0, totalEmployees: 0,
  },
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

  assignLead: async (leadId, employeeId) => {
    try {
      await axiosInstance.patch(`/admin/leads/${leadId}/assign`, { employeeId });
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

  createAppointment: async (data) => {
    try {
      const res = await axiosInstance.post('/admin/appointments', data);
      await get().fetchAppointments();
      return res.data;
    } catch (err: any) {
      throw err;
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

  deleteAppointment: async (id) => {
    try {
      await axiosInstance.delete(`/admin/appointments/${id}`);
      set(state => ({ appointments: state.appointments.filter(a => a._id !== id) }));
    } catch (err: any) {
      throw err;
    }
  },
}));
