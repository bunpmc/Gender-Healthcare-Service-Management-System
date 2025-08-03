/**
 * Application Constants
 */

// Staff Management
export const STAFF_ROLES = {
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist',
  ADMIN: 'admin'
} as const;

export const STAFF_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_LEAVE: 'on_leave'
} as const;

export const GENDER_OPTIONS = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other'
} as const;

// Portal Types
export const PORTAL_TYPES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist'
} as const;

// UI Constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1
} as const;

export const NOTIFICATION_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000
} as const;

// File Export
export const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  EXCEL: 'excel'
} as const;

// API Endpoints (if needed for constants)
export const API_ENDPOINTS = {
  STAFF: '/staff',
  EDGE_FUNCTIONS: '/edge-functions'
} as const;

// Form Validation
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  STAFF_LOAD_ERROR: 'Failed to load staff directory',
  STAFF_CREATE_ERROR: 'Failed to create staff member',
  STAFF_UPDATE_ERROR: 'Failed to update staff member',
  STAFF_DELETE_ERROR: 'Failed to delete staff member',
  EXPORT_ERROR: 'Failed to export data'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  STAFF_LOADED: 'Staff directory loaded successfully',
  STAFF_CREATED: 'Staff member created successfully',
  STAFF_UPDATED: 'Staff member updated successfully',
  STAFF_DELETED: 'Staff member deleted successfully',
  DATA_EXPORTED: 'Data exported successfully'
} as const;
