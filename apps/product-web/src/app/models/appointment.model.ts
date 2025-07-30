import { DashboardPatient } from './patient.model';

// Appointment model based on Supabase database schema
export interface Appointment {
  appointment_id: string;
  patient_id?: string | null;
  phone: string;
  email: string;
  visit_type: 'virtual' | 'internal' | 'external' | 'consultation';
  appointment_status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at?: string;
  updated_at?: string;
  schedule: 'Morning' | 'Afternoon' | 'Evening';
  message?: string | null;
  doctor_id?: string | null;
  category_id?: string | null;
  slot_id?: string | null;
  appointment_date?: string | null;
  appointment_time?: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
}

// Dashboard-specific appointment interface for display
export interface DashboardAppointment {
  id: string;
  title: string;
  type: 'virtual' | 'internal' | 'external' | 'consultation';
  time: string;
  date: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  patientName?: string;
  doctorName?: string;
  schedule: 'Morning' | 'Afternoon' | 'Evening';
}

// Calendar day interface for dashboard calendar
export interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: DashboardAppointment[];
}

// Loading and error state interfaces
export interface DashboardState {
  isLoading: boolean;
  error: string | null;
  patients: DashboardPatient[];
  appointments: DashboardAppointment[];
  totalPatients: number;
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
}
