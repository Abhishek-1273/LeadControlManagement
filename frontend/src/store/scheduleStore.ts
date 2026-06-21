import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

export interface DaySchedule {
  dayOfWeek: number;       // 0=Sunday ... 6=Saturday
  isWorking: boolean;
  startTime: string;       // "HH:MM"
  endTime: string;         // "HH:MM"
  breakStart: string;      // "" = no break
  breakEnd: string;
  slotDuration: number;    // minutes
}

export interface AvailableSlot {
  time: string;            // "HH:MM"
  available: boolean;
  reason: 'break' | 'booked' | null;
}

export interface SlotsResponse {
  date: string;
  dayOfWeek: number;
  isWorking: boolean;
  startTime?: string;
  endTime?: string;
  breakStart?: string;
  breakEnd?: string;
  slotDuration?: number;
  slots: AvailableSlot[];
}

interface ScheduleStore {
  days: DaySchedule[];
  isLoading: boolean;
  error: string | null;

  fetchSchedule: () => Promise<void>;
  updateSchedule: (days: DaySchedule[]) => Promise<void>;
  fetchSlots: (date: string) => Promise<SlotsResponse | null>;
}

const DEFAULT_DAYS: DaySchedule[] = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  isWorking: false,
  startTime: '09:00',
  endTime: '18:00',
  breakStart: '',
  breakEnd: '',
  slotDuration: 30,
}));

export const useScheduleStore = create<ScheduleStore>((set) => ({
  days: DEFAULT_DAYS,
  isLoading: false,
  error: null,

  fetchSchedule: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get('/schedule');
      set({ days: res.data.schedule?.days || DEFAULT_DAYS, isLoading: false });
    } catch (err: any) {
      console.error(
        'fetchSchedule error:',
        err.response?.status,
        err.response?.data?.message || err.message
      );
      set({ isLoading: false, error: err.response?.data?.message || err.message });
    }
  },

  updateSchedule: async (days) => {
    try {
      const res = await axiosInstance.put('/schedule', { days });
      set({ days: res.data.schedule?.days || days });
    } catch (err: any) {
      console.error(
        'updateSchedule error:',
        err.response?.status,
        err.response?.data?.message || err.message
      );
      throw err;
    }
  },

  fetchSlots: async (date) => {
    try {
      const res = await axiosInstance.get(`/schedule/slots?date=${date}`);
      return res.data as SlotsResponse;
    } catch (err: any) {
      console.error(
        'fetchSlots error:',
        err.response?.status,
        err.response?.data?.message || err.message
      );
      return null;
    }
  },
}));