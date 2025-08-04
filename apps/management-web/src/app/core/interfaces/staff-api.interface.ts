import { Staff } from '../../models/staff.interface';

/**
 * API Response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

/**
 * Staff API specific interfaces
 */
export interface CreateStaffRequest {
  full_name: string;
  working_email: string;
  phone?: string;
  role: 'doctor' | 'receptionist'; // Removed 'admin' to match EdgeFunctionService
  years_experience?: number;
  hired_at?: string;
  is_available?: boolean;
  staff_status?: 'active' | 'inactive' | 'on_leave';
  gender?: 'male' | 'female' | 'other';
  languages?: string[];
  password?: string;
  date_of_birth?: string;
  address?: string;
  specialization?: string;
  bio?: string;
}

export interface UpdateStaffRequest extends Partial<CreateStaffRequest> {
  staff_id: string;
}

export interface StaffListResponse extends ApiResponse<Staff[]> {}

export interface StaffDetailsResponse extends ApiResponse<Staff> {}

/**
 * Staff query filters
 */
export interface StaffQueryFilters {
  searchTerm?: string;
  role?: string;
  status?: string;
  availability?: 'available' | 'unavailable';
  page?: number;
  pageSize?: number;
  sortBy?: keyof Staff;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Export options
 */
export interface ExportConfig {
  format: 'json' | 'csv' | 'excel';
  fields?: (keyof Staff)[];
  filename?: string;
  includeHeaders?: boolean;
  filterSensitiveData?: boolean;
}

/**
 * Staff action results
 */
export interface StaffActionResult {
  success: boolean;
  message: string;
  affectedStaff?: Staff;
  errors?: Record<string, string>;
}

/**
 * Edge function test result
 */
export interface EdgeFunctionTestResult {
  success: boolean;
  executionTime?: number;
  responseData?: any;
  error?: string;
  details?: any;
}
