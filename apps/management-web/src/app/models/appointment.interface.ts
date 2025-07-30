export interface Appointment {
  appointment_id: string;
  patient_id: string | null;
  doctor_id: string | null;
  slot_id: string | null;
  category_id: string | null;
  phone: string;
  email: string;
  visit_type: VisitType;
  appointment_status: ProcessStatus;
  created_at: string | null;
  updated_at: string | null;
  schedule: ScheduleEnum;
  message?: string;
  appointment_date?: string;
  appointment_time?: string;
  preferred_date?: string;
  preferred_time?: string;
  // Additional fields for display
  patient_name?: string;
  doctor_name?: string;
  category_name?: string;
}

export interface GuestAppointment {
  guest_appointment_id: string;
  guest_id: string | null;
  slot_id: string | null;
  doctor_id: string | null;
  category_id: string | null;
  phone: string;
  email: string;
  visit_type: VisitType;
  appointment_status: ProcessStatus;
  created_at: string | null;
  updated_at: string | null;
  schedule: ScheduleEnum;
  message?: string;
  appointment_date?: string;
  appointment_time?: string;
  preferred_date?: string;
  preferred_time?: string;
  // Additional fields for display
  guest_name?: string;
  doctor_name?: string;
  category_name?: string;
}

export interface Guest {
  guest_id: string;
  full_name?: string;
  phone: string;
  email: string;
  date_of_birth: string;
  gender: string;
  created_at?: string;
}

export interface DisplayAppointment {
  id: string;
  type: 'patient' | 'guest';
  name: string;
  phone: string;
  email: string;
  visit_type: VisitType;
  appointment_status: ProcessStatus;
  created_at: string | null;
  updated_at: string | null;
  schedule: ScheduleEnum;
  appointment_date?: string;
  appointment_time?: string;
  doctor_name?: string;
  category_name?: string;
}

// Enums
export enum VisitType {
  CONSULTATION = 'consultation',
  FOLLOW_UP = 'follow-up',
  EMERGENCY = 'emergency',
  ROUTINE = 'routine'
}

export enum ProcessStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ScheduleEnum {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening'
}

// Request interfaces
export interface CreateAppointmentRequest {
  patient_id?: string;
  doctor_id: string;
  category_id?: string;
  phone: string;
  email: string;
  visit_type: VisitType;
  schedule: ScheduleEnum;
  message?: string;
  appointment_date?: string;
  appointment_time?: string;
  preferred_date?: string;
  preferred_time?: string;
}

export interface UpdateAppointmentRequest {
  appointment_id: string;
  appointment_status?: ProcessStatus;
  visit_type?: VisitType;
  message?: string;
  appointment_date?: string;
  appointment_time?: string;
}
