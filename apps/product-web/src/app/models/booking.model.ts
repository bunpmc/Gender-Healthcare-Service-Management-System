export interface PhoneRegion {
  code: string;
  flag: string;
  name: string;
  dialCode: string;
  format: string;
  placeholder: string;
}

export interface BookingState {
  type?: 'docfirst' | 'serfirst';
  fullName?: string;
  email?: string;
  phone?: string;
  phoneRegion?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string; // Added date of birth field
  message?: string;
  doctor_id?: string;
  service_id?: string;
  preferred_date?: string;
  preferred_time?: string;
  preferred_slot_id?: string;
  schedule?: 'Morning' | 'Afternoon' | 'Evening'; // Added schedule property
}

export interface DoctorBooking {
  doctor_id: string;
  full_name: string;
  image_link: string;
  gender: string;
  specialization?: string;
  services?: string[]; // Array of service IDs the doctor provides
}

export interface ServiceBooking {
  service_id: string;
  name: string;
  description?: string;
}

export interface TimeSlot {
  doctor_slot_id: string;
  slot_date: string;
  slot_time: string;
  doctor_id: string;
}
export interface DoctorSlotDetail {
  doctor_id: string;
  doctor_slot_id: string;
  appointments_count: number;
  max_appointments: number;
  slot_id: string;
  slot_date: string;
  slot_time: string;
  is_active: boolean;
}

// ========== ENUMS ==========

export enum VisitTypeEnum {
  CONSULTATION = 'consultation',
  CHECKUP = 'checkup',
  FOLLOW_UP = 'follow_up',
  EMERGENCY = 'emergency',
}

export enum ScheduleEnum {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  SPECIFIC_TIME = 'specific_time',
}

// ========== APPOINTMENT INTERFACES ==========

export interface AppointmentCreateRequest {
  // Personal information
  full_name: string;
  phone: string;
  email?: string;
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string; // Added date of birth field

  // Medical information
  visit_type: VisitTypeEnum;
  schedule: ScheduleEnum;
  message?: string;

  // Doctor and service
  doctor_id: string;
  category_id?: string;

  // Slot information
  slot_id?: string;
  preferred_date?: string;
  preferred_time?: string;

  // Booking type
  booking_type?: 'docfirst' | 'serfirst';
}

export interface AppointmentResponse {
  success: boolean;
  message: string;
  appointment_id?: string;
  guest_appointment_id?: string;
  appointment_details?: any;
}

export interface Appointment {
  appointment_id: string;
  patient_id: string;
  phone: string;
  email?: string;
  visit_type: VisitTypeEnum;
  schedule: ScheduleEnum;
  message?: string;
  doctor_id: string;
  category_id?: string;
  slot_id?: string;
  preferred_date?: string;
  preferred_time?: string;
  appointment_date?: string;
  appointment_time?: string;
  appointment_status:
    | 'pending'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | 'rescheduled';
  created_at?: string;
  updated_at?: string;
}

export interface GuestAppointment {
  guest_appointment_id: string;
  guest_id: string;
  phone: string;
  email?: string;
  visit_type: VisitTypeEnum;
  schedule: ScheduleEnum;
  message?: string;
  doctor_id: string;
  category_id?: string;
  slot_id?: string;
  preferred_date?: string;
  preferred_time?: string;
  appointment_date?: string;
  appointment_time?: string;
  appointment_status:
    | 'pending'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | 'rescheduled';
  created_at?: string;
  updated_at?: string;
}

export interface Guest {
  guest_id: string;
  full_name: string;
  email?: string;
  phone: string;
  gender?: 'male' | 'female' | 'other';
  created_at?: string;
  updated_at?: string;
}
