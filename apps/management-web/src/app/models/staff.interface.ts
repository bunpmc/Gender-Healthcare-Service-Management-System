export interface Staff {
  // Core database fields (matching schema)
  staff_id: string;
  full_name: string;
  working_email: string;
  role: string; // staff_role_enum
  years_experience?: number;
  hired_at: string; // Date will be handled as string from Supabase
  is_available: boolean;
  staff_status: string; // staff_status enum
  created_at?: string;
  updated_at?: string;
  image_link?: string;
  gender?: string; // gender_enum
  languages?: string[]; // json[] in database

  // REMOVED: Fields not in database schema
  // phone?: string; 
  // phone_number?: string;
  // date_of_birth?: string;
  // address?: string;
  // specialization?: string;
  // bio?: string;
  // password?: string;

  // Avatar and display properties (computed from database fields)
  avatar_url?: string;
  imageUrl?: string; // Legacy compatibility
  experience_display?: string;

  // Legacy compatibility properties for old code
  id?: string; // Alternative to staff_id
  name?: string; // Alternative to full_name
  email?: string; // Alternative to working_email
  status?: string; // Alternative to staff_status
  startDate?: string; // Alternative to hired_at
}

export interface Role {
  value: string;
  label: string;
}

export type StaffStatus = 'active' | 'inactive' | 'on_leave'; // Adjust based on staff_status enum values
export type Gender = 'male' | 'female' | 'other'; // Adjust based on gender_enum values

// Doctor Details Interface
export interface DoctorDetails {
  doctor_id: string;
  department: string;
  speciality: string;
  about_me?: any;
  license_no: string;
  bio?: string;
  slogan?: string;
  educations?: any;
  certifications?: any;
}

// Combined Doctor Interface
export interface Doctor extends Staff {
  doctor_details?: DoctorDetails;
}

// Enums for Doctor
export enum Department {
  REPRODUCTIVE_HEALTH = 'reproductive_health',
  UROLOGY = 'urology',
  GYNECOLOGY = 'gynecology',
  TRANSGENDER_CARE = 'transgender_care',
  SEXUAL_HEALTH = 'sexual_health'
}

export enum Speciality {
  REPRODUCTIVE_SPECIALIST = 'reproductive_specialist',
  UROLOGIST = 'urologist',
  GYNECOLOGIST = 'gynecologist',
  ENDOCRINOLOGIST = 'endocrinologist',
  SEXUAL_HEALTH_SPECIALIST = 'sexual_health_specialist'
}


