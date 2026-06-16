export type LeadStatus =
  | 'New Lead'
  | 'Contacted'
  | 'Follow Up'
  | 'Interested'
  | 'Visitor'
  | 'Booked'
  | 'Uninterested'
  | 'No Response'

export interface Lead {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  source: string;
  campaign?: string;
  car?: string;           
  visitorDate?: string;
  status: LeadStatus;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
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
  type: 'created' | 'status_changed' | 'note_added' | 'followup_added' | 'assigned';
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