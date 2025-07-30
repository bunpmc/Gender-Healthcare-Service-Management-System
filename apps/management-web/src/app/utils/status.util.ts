/**
 * Status Utility Service
 * Provides consistent status handling across the application
 * Ensures all status values follow the same format and conventions
 */

// Appointment Status Types
export type AppointmentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'overdue';
export type PatientStatus = 'active' | 'inactive' | 'deleted';
export type StaffStatus = 'active' | 'inactive' | 'on_leave';

// Status Configuration Interface
interface StatusConfig {
  value: string;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon?: string;
}

export class StatusUtil {
  // Appointment Status Configurations
  static readonly APPOINTMENT_STATUSES: Record<AppointmentStatus, StatusConfig> = {
    pending: {
      value: 'pending',
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800',
      bgColor: '#fef3c7',
      textColor: '#92400e',
      icon: 'clock'
    },
    in_progress: {
      value: 'in_progress',
      label: 'In Progress',
      color: 'bg-blue-100 text-blue-800',
      bgColor: '#dbeafe',
      textColor: '#1e40af',
      icon: 'play'
    },
    completed: {
      value: 'completed',
      label: 'Completed',
      color: 'bg-green-100 text-green-800',
      bgColor: '#d1fae5',
      textColor: '#065f46',
      icon: 'check'
    },
    cancelled: {
      value: 'cancelled',
      label: 'Cancelled',
      color: 'bg-red-100 text-red-800',
      bgColor: '#fee2e2',
      textColor: '#991b1b',
      icon: 'x'
    }
  };

  // Payment Status Configurations
  static readonly PAYMENT_STATUSES: Record<PaymentStatus, StatusConfig> = {
    pending: {
      value: 'pending',
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800',
      bgColor: '#fef3c7',
      textColor: '#92400e',
      icon: 'clock'
    },
    paid: {
      value: 'paid',
      label: 'Paid',
      color: 'bg-green-100 text-green-800',
      bgColor: '#d1fae5',
      textColor: '#065f46',
      icon: 'check'
    },
    partial: {
      value: 'partial',
      label: 'Partial',
      color: 'bg-blue-100 text-blue-800',
      bgColor: '#dbeafe',
      textColor: '#1e40af',
      icon: 'minus'
    },
    overdue: {
      value: 'overdue',
      label: 'Overdue',
      color: 'bg-red-100 text-red-800',
      bgColor: '#fee2e2',
      textColor: '#991b1b',
      icon: 'exclamation'
    }
  };

  // Patient Status Configurations
  static readonly PATIENT_STATUSES: Record<PatientStatus, StatusConfig> = {
    active: {
      value: 'active',
      label: 'Active',
      color: 'bg-green-100 text-green-800',
      bgColor: '#d1fae5',
      textColor: '#065f46',
      icon: 'check'
    },
    inactive: {
      value: 'inactive',
      label: 'Inactive',
      color: 'bg-gray-100 text-gray-800',
      bgColor: '#f3f4f6',
      textColor: '#374151',
      icon: 'pause'
    },
    deleted: {
      value: 'deleted',
      label: 'Deleted',
      color: 'bg-red-100 text-red-800',
      bgColor: '#fee2e2',
      textColor: '#991b1b',
      icon: 'trash'
    }
  };

  // Staff Status Configurations
  static readonly STAFF_STATUSES: Record<StaffStatus, StatusConfig> = {
    active: {
      value: 'active',
      label: 'Active',
      color: 'bg-green-100 text-green-800',
      bgColor: '#d1fae5',
      textColor: '#065f46',
      icon: 'check'
    },
    inactive: {
      value: 'inactive',
      label: 'Inactive',
      color: 'bg-gray-100 text-gray-800',
      bgColor: '#f3f4f6',
      textColor: '#374151',
      icon: 'pause'
    },
    on_leave: {
      value: 'on_leave',
      label: 'On Leave',
      color: 'bg-yellow-100 text-yellow-800',
      bgColor: '#fef3c7',
      textColor: '#92400e',
      icon: 'calendar'
    }
  };

  /**
   * Get appointment status configuration
   */
  static getAppointmentStatus(status: string): StatusConfig {
    return this.APPOINTMENT_STATUSES[status as AppointmentStatus] || {
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1),
      color: 'bg-gray-100 text-gray-800',
      bgColor: '#f3f4f6',
      textColor: '#374151'
    };
  }

  /**
   * Get payment status configuration
   */
  static getPaymentStatus(status: string): StatusConfig {
    return this.PAYMENT_STATUSES[status as PaymentStatus] || {
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1),
      color: 'bg-gray-100 text-gray-800',
      bgColor: '#f3f4f6',
      textColor: '#374151'
    };
  }

  /**
   * Get patient status configuration
   */
  static getPatientStatus(status: string): StatusConfig {
    return this.PATIENT_STATUSES[status as PatientStatus] || {
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1),
      color: 'bg-gray-100 text-gray-800',
      bgColor: '#f3f4f6',
      textColor: '#374151'
    };
  }

  /**
   * Get staff status configuration
   */
  static getStaffStatus(status: string): StatusConfig {
    return this.STAFF_STATUSES[status as StaffStatus] || {
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1),
      color: 'bg-gray-100 text-gray-800',
      bgColor: '#f3f4f6',
      textColor: '#374151'
    };
  }

  /**
   * Get all appointment status options for dropdowns
   */
  static getAppointmentStatusOptions(): StatusConfig[] {
    return Object.values(this.APPOINTMENT_STATUSES);
  }

  /**
   * Get all payment status options for dropdowns
   */
  static getPaymentStatusOptions(): StatusConfig[] {
    return Object.values(this.PAYMENT_STATUSES);
  }

  /**
   * Get all patient status options for dropdowns
   */
  static getPatientStatusOptions(): StatusConfig[] {
    return Object.values(this.PATIENT_STATUSES);
  }

  /**
   * Get all staff status options for dropdowns
   */
  static getStaffStatusOptions(): StatusConfig[] {
    return Object.values(this.STAFF_STATUSES);
  }

  /**
   * Validate if status is valid for appointment
   */
  static isValidAppointmentStatus(status: string): boolean {
    return status in this.APPOINTMENT_STATUSES;
  }

  /**
   * Validate if status is valid for payment
   */
  static isValidPaymentStatus(status: string): boolean {
    return status in this.PAYMENT_STATUSES;
  }

  /**
   * Get next possible statuses for appointment workflow
   */
  static getNextAppointmentStatuses(currentStatus: string): StatusConfig[] {
    switch (currentStatus) {
      case 'pending':
        return [this.APPOINTMENT_STATUSES.in_progress, this.APPOINTMENT_STATUSES.cancelled];
      case 'in_progress':
        return [this.APPOINTMENT_STATUSES.completed, this.APPOINTMENT_STATUSES.cancelled];
      case 'completed':
      case 'cancelled':
        return []; // Terminal states
      default:
        return this.getAppointmentStatusOptions();
    }
  }

  /**
   * Get CSS class for status badge
   */
  static getStatusBadgeClass(status: string, type: 'appointment' | 'payment' | 'patient' | 'staff' = 'appointment'): string {
    let config: StatusConfig;
    
    switch (type) {
      case 'payment':
        config = this.getPaymentStatus(status);
        break;
      case 'patient':
        config = this.getPatientStatus(status);
        break;
      case 'staff':
        config = this.getStaffStatus(status);
        break;
      default:
        config = this.getAppointmentStatus(status);
    }
    
    return config.color;
  }
}
