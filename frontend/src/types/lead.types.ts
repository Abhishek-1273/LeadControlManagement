export type LeadStatus =
  | 'New'
  | 'Interested'
  | 'Contacted'
  | 'Not Interested'
  | 'Pending'
  | 'Booked'
  | 'Deleted'

export interface Lead {
  _id: string;
  name: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  city?: string;
  source: string;
  campaign?: string;
  car?: string;
  status: LeadStatus;
  assignedTo: string;
  isDeleted?: boolean;
  deletedAt?: string;
  statusBeforeDelete?: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  visitorDate?: string;
  notes?: Note[];
  followUps?: FollowUp[];
  timeline?: TimelineEntry[];
}

export interface Note {
  _id: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface FollowUp {
  _id: string;
  date: string;
  time: string;
  notes: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface TimelineEntry {
  _id: string;
  type: 'created' | 'status_changed' | 'note_added' | 'followup_added' | 'assigned' | 'appointment_set';
  description: string;
  createdAt: string;
}

export interface LeadFilters {
  status?: LeadStatus;
  source?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface Appointment {
  _id: string;
  lead: {
    _id: string;
    name: string;
    phone: string;
    status: LeadStatus;
    assignedTo?: { _id: string; name: string; email: string };
  };
  appointmentDate: string;
  appointmentTime: string;
  description?: string;
  status: 'scheduled' | 'completed' | 'missed';
  createdBy: { _id: string; name: string };
  createdAt: string;
}