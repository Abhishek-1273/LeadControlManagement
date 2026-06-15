import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

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
  interested: number;
  visitor: number;
  booked: number;
  totalEmployees: number;
  newLeads: number;
  uninterested: number;
}

interface AdminStore {
  employees: Employee[];
  selectedEmployee: Employee | null;
  stats: AdminStats;
  isLoading: boolean;
  error: string | null;

  fetchEmployees: () => Promise<void>;
  fetchEmployeeById: (id: string) => Promise<void>;
  addEmployee: (data: any) => Promise<void>;
  updateEmployee: (id: string, data: any) => Promise<void>;
  toggleEmployeeStatus: (id: string) => Promise<void>;
  fetchAdminStats: () => Promise<void>;
  assignLead: (leadId: string, employeeId: string) => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  employees: [],
  selectedEmployee: null,
  stats: {
    totalLeads: 0, todayLeads: 0, interested: 0,
    visitor: 0, booked: 0, totalEmployees: 0,
    newLeads: 0, uninterested: 0,
  },
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
      await axiosInstance.patch(`/admin/leads/${leadId}/assign`, {
        employeeId
      });
    } catch (err: any) {
      throw err;
    }
  },
}));