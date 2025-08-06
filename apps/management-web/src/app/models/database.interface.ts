// Core types based on Supabase schema
export type GenderEnum = 'male' | 'female' | 'other' | '';
export type DepartmentEnum = 'reproductive_health' | 'gynecology' | 'urology' | 'transgender_care' | 'sexual_health';
export type NotificationTypeEnum = 'appointment_reminder' | 'new_appointment' | 'appointment_update' | 'general';
export type PatientStatus = 'active' | 'inactive' | 'suspended' | 'deleted';
export type ProcessStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'no_show';
export type RoleEnum = 'admin' | 'doctor' | 'receptionist' | 'patient';
export type ScheduleEnum = 'morning' | 'afternoon' | 'evening' | 'full_day';
export type SpecialityEnum = 'gynecologist' | 'urologist' | 'endocrinologist' | 'reproductive_specialist' | 'sexual_health_specialist' | 'general_practitioner';
export type StaffRole = 'doctor' | 'receptionist';
export type StaffStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';
export type TicketScheduleEnum = 'morning' | 'afternoon' | 'evening';
export type VaccinationStatusEnum = 'not_vaccinated' | 'partially_vaccinated' | 'fully_vaccinated';
export type VisitTypeEnum = 'consultation' | 'follow-up' | 'emergency' | 'routine';
export type BlogStatus = 'draft' | 'published' | 'archived';

// Base Entity interface
export interface BaseEntity {
    created_at?: string;
    updated_at?: string;
}

// Patient interface based on database schema
export interface Patient extends BaseEntity {
    patient_id: string;
    id: string; // Legacy field for compatibility - required not optional
    guest_id?: string; // Added for guest compatibility
    full_name: string;
    email: string;
    phone: string;
    phone_number?: string; // Legacy field for compatibility
    date_of_birth?: string; // Changed from Date | string to just string for template compatibility
    gender?: GenderEnum;
    emergency_contact?: string;
    emergency_contact_name?: string; // Added for compatibility
    emergency_contact_phone?: string; // Added for compatibility
    allergies?: any; // Changed from string[] to any for compatibility
    chronic_conditions?: any; // Added for compatibility
    past_surgeries?: any; // Added for compatibility
    medications?: string[];
    medical_history?: any; // JSON type
    vaccination_status?: VaccinationStatusEnum;
    patient_status?: PatientStatus;
    address?: string;
    image_link?: string;
    bio?: string; // Added for compatibility
    patient_type?: 'patient' | 'guest'; // Added for compatibility
}// Staff Member interface based on database schema
export interface StaffMember extends BaseEntity {
    staff_id: string;
    full_name: string;
    working_email: string;
    role: StaffRole;
    years_experience?: number;
    hired_at: Date | string;
    is_available: boolean;
    staff_status: StaffStatus;
    image_link?: string;
    gender?: GenderEnum;
    languages?: any[]; // JSON array type
}

// Doctor Details interface
export interface DoctorDetails extends BaseEntity {
    doctor_id: string;
    staff_id: string;
    speciality: SpecialityEnum;
    consultation_fee: number;
    education?: any; // JSON type
    educations?: any; // Alternative field name for compatibility
    certifications?: any; // JSON type
    bio?: string;
    rating?: number;
    years_of_experience?: number;
    department?: DepartmentEnum;
}

// Medical Service interface
// Medical Service interface
export interface MedicalService extends BaseEntity {
    service_id: string;
    category_id: string;
    service_name: string;
    service_cost?: number | null; // Allow null for compatibility
    service_price?: number | null; // Added for compatibility  
    duration_minutes?: number | null; // Allow null for compatibility
    is_active?: boolean;
    image_link?: string | null; // Allow null for compatibility
    service_description?: any; // JSON type
    excerpt?: string | null; // Allow null for compatibility
}// Service Category interface
export interface MedicalServiceCategory extends BaseEntity {
    category_id: string;
    category_name: string;
    category_description?: string;
}

// Appointment interface based on database schema
export interface Appointment extends BaseEntity {
    appointment_id: string;
    patient_id?: string;
    phone: string;
    email: string;
    visit_type: VisitTypeEnum;
    appointment_status?: ProcessStatus;
    schedule: ScheduleEnum;
    message?: string;
    doctor_id?: string;
    category_id?: string;
    slot_id?: string;
    appointment_date?: Date | string;
    appointment_time?: string;
    preferred_date?: Date | string;
    preferred_time?: string;
}

// Guest interface
export interface Guest extends BaseEntity {
    guest_id: string;
    full_name: string;
    email: string;
    phone: string;
    date_of_birth?: Date | string;
    gender?: GenderEnum;
    emergency_contact?: string;
    address?: string;
}

// Slot interface
export interface Slot extends BaseEntity {
    slot_id: string;
    slot_date: Date | string;
    start_time: string;
    end_time: string;
    is_available: boolean;
    max_appointments: number;
    current_appointments: number;
}

// Doctor Slot Assignment interface
export interface DoctorSlotAssignment {
    assignment_id: string;
    slot_id: string;
    doctor_id: string;
}

// Blog Post interface
export interface BlogPost extends BaseEntity {
    blog_id: string;
    doctor_id: string;
    blog_title: string;
    blog_content: string;
    excerpt?: string;
    image_link?: string;
    blog_tags?: any; // JSON type
    published_at?: string;
    blog_status?: BlogStatus;
    view_count?: number;
    // Additional fields for joins
    staff_members?: {
        full_name: string;
    };
    doctor_name?: string;
}

// Patient Report interface
export interface PatientReport extends BaseEntity {
    report_id: string;
    patient_id: string;
    doctor_id: string;
    appointment_id?: string;
    report_content?: any; // JSON type
    report_date: Date | string;
    diagnosis?: string;
    prescription?: any; // JSON type
    follow_up_date?: Date | string;
    additional_notes?: string;
    report_status?: string; // Added for compatibility
    report_description?: string; // Added for compatibility
    staff_id?: string; // Added for compatibility
    patient_name?: string; // For display
    doctor_name?: string; // For display
}

// Transaction interface
export interface Transaction extends BaseEntity {
    transaction_id: string;
    patient_id?: string;
    appointment_id?: string;
    amount: number;
    transaction_status: ProcessStatus;
    payment_method?: string;
    transaction_date: Date | string;
    description?: string;
    reference_number?: string;
}

// Staff Schedule interface
export interface StaffSchedule extends BaseEntity {
    schedule_id: string;
    staff_id: string;
    start_time: string;
    end_time: string;
    schedule_date: Date | string;
    is_available: boolean;
    notes?: string;
}

// Period Tracking interface (for patients)
export interface PeriodTracking extends BaseEntity {
    tracking_id: string;
    patient_id: string;
    start_date: Date | string;
    end_date?: Date | string;
    cycle_length?: number;
    flow_intensity?: string;
    symptoms?: string[];
    notes?: string;
}

// Log interface for audit trail
export interface Log {
    id: number;
    table_name: string;
    operation: string;
    old_data?: any; // JSON type
    new_data?: any; // JSON type
    changed_by?: string;
    changed_at: string;
}

// Receipt interface
export interface Receipt extends BaseEntity {
    receipt_id: string;
    transaction_id: string;
    patient_id?: string;
    receipt_data?: any; // JSON type
    receipt_date: Date | string;
    total_amount: number;
}

// Ticket interface
export interface Ticket extends BaseEntity {
    ticket_id: string;
    patient_id?: string;
    staff_id?: string;
    ticket_title: string;
    ticket_content: string;
    ticket_status: ProcessStatus;
    priority?: string;
    category?: string;
    resolution?: string;
    resolved_at?: string;
    resolved_by?: string;
}
