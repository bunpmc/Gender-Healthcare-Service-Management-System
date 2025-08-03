import { Staff } from '../../../models/staff.interface';

// Configuration interface for different portals
export interface StaffManagementConfig {
  portal: 'admin' | 'doctor' | 'receptionist';
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canTestEdgeFunction: boolean;
  allowedRoles?: string[];
  customActions?: CustomAction[];
}

// Custom action interface
export interface CustomAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  permission?: (staff: Staff) => boolean;
}

// Staff action interface (deprecated - use CustomAction)
export interface StaffAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  handler: (staff: Staff) => void;
  permission?: (staff: Staff) => boolean;
}

// Filter configuration
export interface StaffFilters {
  search: string;
  role: string;
  status: string;
  availability: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

// Pagination configuration
export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  total: number;
}

// Modal configuration
export interface ModalConfig {
  mode: 'view' | 'edit' | 'create';
  allowEdit?: boolean;
}

// Staff management events
export interface StaffManagementEvents {
  onCreate?: (staffData: Partial<Staff>) => void;
  onUpdate?: (staffData: Partial<Staff>) => void;
  onDelete?: (staff: Staff) => void;
  onExport?: (staffList: Staff[]) => void;
  onTestEdgeFunction?: () => void;
  onCustomAction?: (action: string, staff: Staff) => void;
}

// Table column configuration
export interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  width?: string;
  visible: boolean;
}

// Form validation errors
export interface FormErrors {
  [key: string]: boolean;
}

// Form data interface
export interface StaffFormData extends Partial<Staff> {
  imageFile?: File;
  languagesInput?: string;
}

// Export options
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  fields: string[];
  filename?: string;
}
