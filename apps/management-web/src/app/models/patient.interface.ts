// Re-export Patient from database.interface.ts for consistency
export type { Patient } from './database.interface';

// Keep legacy interface for backward compatibility if needed
export interface LegacyPatient {
  id: string;
  full_name: string;
  phone: string;
  phone_number?: string; // Alias for phone for backward compatibility
  email: string;
  date_of_birth: string | Date | undefined;
  gender: 'male' | 'female' | 'other' | '';
  allergies: any | null; // JSON field
  chronic_conditions: any | null; // JSON field
  past_surgeries: any | null; // JSON field
  vaccination_status:
  | 'not_vaccinated'
  | 'partially_vaccinated'
  | 'fully_vaccinated';
  patient_status: 'active' | 'inactive' | 'deleted';
  created_at: string | null;
  updated_at: string | null;
  image_link: string | null;
  bio: string | null;
  // Additional fields for compatibility
  address?: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  // Patient type for distinguishing between registered patients and guests
  patient_type?: 'patient' | 'guest';
}
