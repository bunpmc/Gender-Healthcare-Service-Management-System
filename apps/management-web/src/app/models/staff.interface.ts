export interface Staff {
  staff_id: string;
  full_name: string;
  working_email: string;
  phone?: string; // Phone number
  phone_number?: string; // Alternative phone field for compatibility
  role: string; // Assuming staff_role_enum is a string-based enum
  years_experience?: number;
  hired_at: string; // Date will be handled as string from Supabase
  is_available: boolean;
  staff_status: string; // Assuming staff_status is a string-based enum
  created_at?: string;
  updated_at?: string;
  image_link?: string;
  gender?: string; // Assuming gender_enum is a string-based enum
  languages?: string[];
  password?: string; // For authentication purposes - handle securely
  
  // Additional fields for comprehensive staff management
  date_of_birth?: string;
  address?: string;
  specialization?: string;
  bio?: string;
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


