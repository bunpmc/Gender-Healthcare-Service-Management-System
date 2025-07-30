import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisitType, ProcessStatus, ScheduleEnum } from '../../../models/appointment.interface';

// Enhanced unified appointment interface for admin table (supports both patient and guest appointments)
export interface AdminAppointment {
  // Common appointment fields
  appointment_id: string;
  appointment_type: 'patient' | 'guest'; // Distinguishes between patient and guest appointments

  // Foreign key fields
  patient_id?: string; // For patient appointments
  guest_id?: string; // For guest appointments
  doctor_id?: string;
  slot_id?: string;
  category_id?: string;

  // Contact information
  phone: string;
  email: string;

  // Appointment details
  visit_type: VisitType | string;
  appointment_status: ProcessStatus | string;
  created_at?: string;
  updated_at?: string;
  schedule?: ScheduleEnum | string;
  message?: string;
  appointment_date?: string;
  appointment_time?: string;
  preferred_date?: string;
  preferred_time?: string;

  // Display fields from JOIN queries
  display_name?: string; // Unified name field (patient name or guest name/phone)
  patient_name?: string; // For patient appointments
  guest_name?: string; // For guest appointments
  patient_phone?: string;
  patient_email?: string;
  doctor_name?: string;
  category_name?: string;
  slot_date?: string;
  slot_time?: string;

  // Original table identifiers for CRUD operations
  original_table?: 'appointments' | 'guest_appointments';
  original_id?: string; // appointment_id or guest_appointment_id
}

export type SortField = 'patient_name' | 'doctor_name' | 'appointment_date' | 'appointment_status' | 'visit_type' | 'created_at';
export type SortDirection = 'asc' | 'desc' | null;

@Component({
  selector: 'app-appointment-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-table.component.html',
  styleUrls: ['./appointment-table.component.css']
})
export class AppointmentTableComponent {
  @Input() paginatedAppointments: AdminAppointment[] = [];
  @Input() totalAppointments: number = 0;
  @Input() currentPage: number = 1;

  @Output() viewAppointmentEvent = new EventEmitter<AdminAppointment>();
  @Output() editAppointmentEvent = new EventEmitter<AdminAppointment>();
  @Output() deleteAppointmentEvent = new EventEmitter<AdminAppointment>();
  @Output() sortChange = new EventEmitter<{ field: SortField; direction: SortDirection }>();
  @Output() bulkAction = new EventEmitter<{ action: string; appointmentIds: string[] }>();
  @Output() clearFiltersEvent = new EventEmitter<void>();

  // Selection state
  selectedAppointments = new Set<string>();

  // Sorting state
  sortField: SortField | null = null;
  sortDirection: SortDirection = null;

  /**
   * Track by function for ngFor performance
   */
  trackByAppointmentId(index: number, appointment: AdminAppointment): string {
    return appointment.appointment_id;
  }

  /**
   * Toggle selection of a single appointment
   */
  toggleAppointmentSelection(appointmentId: string): void {
    if (this.selectedAppointments.has(appointmentId)) {
      this.selectedAppointments.delete(appointmentId);
    } else {
      this.selectedAppointments.add(appointmentId);
    }
  }

  /**
   * Toggle selection of all appointments
   */
  toggleAllSelection(): void {
    if (this.isAllSelected()) {
      this.selectedAppointments.clear();
    } else {
      this.paginatedAppointments.forEach((appointment: AdminAppointment) => {
        this.selectedAppointments.add(appointment.appointment_id);
      });
    }
  }

  /**
   * Check if all appointments are selected
   */
  isAllSelected(): boolean {
    return this.paginatedAppointments.length > 0 &&
           this.paginatedAppointments.every(appointment =>
             this.selectedAppointments.has(appointment.appointment_id)
           );
  }

  /**
   * Check if some but not all appointments are selected
   */
  isPartiallySelected(): boolean {
    const selectedCount = this.paginatedAppointments.filter((appointment: AdminAppointment) =>
      this.selectedAppointments.has(appointment.appointment_id)
    ).length;
    return selectedCount > 0 && selectedCount < this.paginatedAppointments.length;
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.selectedAppointments.clear();
  }

  /**
   * Handle sorting
   */
  sort(field: SortField): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.sortChange.emit({ field: this.sortField, direction: this.sortDirection });
  }

  /**
   * View appointment details
   */
  viewAppointment(appointment: AdminAppointment): void {
    this.viewAppointmentEvent.emit(appointment);
  }

  /**
   * Edit appointment
   */
  editAppointment(appointment: AdminAppointment): void {
    this.editAppointmentEvent.emit(appointment);
  }

  /**
   * Delete appointment
   */
  deleteAppointment(appointment: AdminAppointment): void {
    this.deleteAppointmentEvent.emit(appointment);
  }

  /**
   * Bulk update status
   */
  bulkUpdateStatus(status: string): void {
    const selectedIds = Array.from(this.selectedAppointments);
    if (selectedIds.length > 0) {
      this.bulkAction.emit({ action: `update_status_${status}`, appointmentIds: selectedIds });
    }
  }

  /**
   * Bulk delete appointments
   */
  bulkDelete(): void {
    const selectedIds = Array.from(this.selectedAppointments);
    if (selectedIds.length > 0) {
      this.bulkAction.emit({ action: 'delete', appointmentIds: selectedIds });
    }
  }

  /**
   * Clear filters
   */
  clearFilters(): void {
    this.clearFiltersEvent.emit();
  }

  /**
   * Format date for display
   */
  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  }

  /**
   * Format time for display
   */
  formatTime(time: string | undefined): string {
    if (!time) return 'N/A';
    try {
      // Handle both full datetime and time-only strings
      const timeStr = time.includes('T') ? time.split('T')[1] : time;
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    } catch {
      return 'Invalid Time';
    }
  }

  /**
   * Format visit type for display
   */
  formatVisitType(visitType: string): string {
    const typeMap: { [key: string]: string } = {
      'consultation': 'Consultation',
      'follow-up': 'Follow Up',
      'emergency': 'Emergency',
      'routine': 'Routine'
    };
    return typeMap[visitType] || visitType;
  }

  /**
   * Format status for display
   */
  formatStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  /**
   * Get CSS classes for visit type badge
   */
  getVisitTypeClass(visitType: string): string {
    const classMap: { [key: string]: string } = {
      'consultation': 'bg-blue-100 text-blue-800',
      'follow-up': 'bg-green-100 text-green-800',
      'emergency': 'bg-red-100 text-red-800',
      'routine': 'bg-purple-100 text-purple-800'
    };
    return classMap[visitType] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get CSS classes for status badge
   */
  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'completed': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }
}
