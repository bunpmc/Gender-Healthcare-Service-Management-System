export interface Slot {
  slot_id: string;
  slot_date: string;
  slot_time: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DoctorSlotAssignment {
  doctor_slot_id: string;
  slot_id: string;
  doctor_id: string;
  appointments_count: number;
  max_appointments: number;
  // Additional fields for display
  slot_date?: string;
  slot_time?: string;
  doctor_name?: string;
  is_available?: boolean;
}

export interface SlotWithAssignment extends Slot {
  assignment?: DoctorSlotAssignment;
  is_assigned?: boolean;
  appointments_count?: number;
  max_appointments?: number;
}

export interface CreateSlotRequest {
  slot_date: string;
  slot_time: string;
  is_active?: boolean;
}

export interface CreateDoctorSlotAssignmentRequest {
  slot_id: string;
  doctor_id: string;
  max_appointments?: number;
}

export interface UpdateDoctorSlotAssignmentRequest {
  doctor_slot_id: string;
  max_appointments?: number;
}

// Additional interfaces for Consultant Meetings page
export interface DoctorSlotWithDetails extends DoctorSlotAssignment {
  slot_details: Slot;
  doctor_name?: string;
  is_full: boolean;
  availability_percentage: number;
  appointments?: SlotAppointment[];
}

export interface SlotAppointment {
  appointment_id: string;
  appointment_date?: string;
  appointment_time?: string;
  appointment_status: string;
  visit_type: string;
  patient_name: string;
  phone?: string;
  email?: string;
  appointment_type: 'patient' | 'guest';
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasSlots: boolean;
  slots: DoctorSlotWithDetails[];
  totalSlots: number;
  totalAppointments: number;
  maxAppointments: number;
}

export interface SlotFilter {
  dateFrom?: string;
  dateTo?: string;
  status?: 'all' | 'active' | 'inactive' | 'full' | 'available';
  searchTerm?: string;
}

export enum SlotStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FULL = 'full',
  AVAILABLE = 'available'
}

export interface SlotStatistics {
  totalSlots: number;
  activeSlots: number;
  fullSlots: number;
  totalAppointments: number;
  totalCapacity: number;
  utilizationRate: number;
}
