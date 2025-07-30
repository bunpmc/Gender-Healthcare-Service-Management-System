import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../supabase.service';
import { AppointmentSearchBarComponent, AppointmentFilters, Doctor } from './appointment-search-bar/appointment-search-bar.component';
import { AppointmentTableComponent, AdminAppointment, SortField, SortDirection } from './appointment-table/appointment-table.component';

@Component({
  selector: 'app-appointment-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AppointmentSearchBarComponent, AppointmentTableComponent],
  templateUrl: './appointment-management.component.html',
  styleUrls: ['./appointment-management.component.css']
})
export class AppointmentManagementComponent implements OnInit {
  // Data properties
  appointments: AdminAppointment[] = [];
  filteredAppointments: AdminAppointment[] = [];
  doctors: Doctor[] = [];
  isLoading = false;

  // Pagination
  currentPage: number = 1;
  readonly pageSize: number = 10;

  // Filtering and sorting
  currentFilters: AppointmentFilters = {
    query: '',
    status: '',
    visitType: '',
    doctor: '',
    dateRange: '',
    appointmentType: ''
  };
  sortField: SortField | null = null;
  sortDirection: SortDirection = null;

  // Modal states
  showViewModal = false;
  showEditModal = false;
  selectedAppointment: AdminAppointment | null = null;

  // Edit modal states
  isUpdating = false;
  updateError: string | null = null;
  updateSuccess: string | null = null;

  // Validation properties
  validationErrors: { [key: string]: string } = {};

  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit() {
    await this.loadAppointments();
    await this.loadDoctors();
  }



  async loadAppointments() {
    this.isLoading = true;
    try {
      const result = await this.supabaseService.getAllAppointments();
      if (result.success && result.data) {
        this.appointments = result.data;
        this.filteredAppointments = [...this.appointments];
        this.applyFilters(this.currentFilters);
      } else {
        console.error('Error loading appointments:', result.error);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadDoctors() {
    try {
      const result = await this.supabaseService.getAllStaff();
      if (result.success && result.data) {
        this.doctors = result.data
          .filter(staff => staff.role === 'doctor')
          .map(staff => ({
            staff_id: staff.staff_id,
            full_name: staff.full_name
          }));
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  }

  get paginatedAppointments(): AdminAppointment[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredAppointments.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAppointments.length / this.pageSize);
  }

  // Pagination methods
  goToFirstPage() {
    this.currentPage = 1;
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToLastPage() {
    this.currentPage = this.totalPages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Filtering methods
  applyFilters(filters: AppointmentFilters): void {
    this.currentFilters = filters;
    this.filteredAppointments = this.appointments.filter((appointment: AdminAppointment) => {
      // Search query filter
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const searchableText = [
          appointment.display_name,
          appointment.patient_name,
          appointment.guest_name,
          appointment.doctor_name,
          appointment.phone,
          appointment.email,
          appointment.appointment_id,
          appointment.appointment_type
        ].join(' ').toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Status filter
      if (filters.status && appointment.appointment_status !== filters.status) {
        return false;
      }

      // Visit type filter
      if (filters.visitType && appointment.visit_type !== filters.visitType) {
        return false;
      }

      // Doctor filter
      if (filters.doctor && appointment.doctor_id !== filters.doctor) {
        return false;
      }

      // Appointment type filter
      if (filters.appointmentType && appointment.appointment_type !== filters.appointmentType) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const appointmentDate = new Date(appointment.appointment_date || appointment.slot_date || '');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (filters.dateRange) {
          case 'today':
            const todayEnd = new Date(today);
            todayEnd.setHours(23, 59, 59, 999);
            if (appointmentDate < today || appointmentDate > todayEnd) return false;
            break;
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowEnd = new Date(tomorrow);
            tomorrowEnd.setHours(23, 59, 59, 999);
            if (appointmentDate < tomorrow || appointmentDate > tomorrowEnd) return false;
            break;
          case 'this_week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            if (appointmentDate < weekStart || appointmentDate > weekEnd) return false;
            break;
          case 'next_week':
            const nextWeekStart = new Date(today);
            nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
            const nextWeekEnd = new Date(nextWeekStart);
            nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
            nextWeekEnd.setHours(23, 59, 59, 999);
            if (appointmentDate < nextWeekStart || appointmentDate > nextWeekEnd) return false;
            break;
          case 'this_month':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            monthEnd.setHours(23, 59, 59, 999);
            if (appointmentDate < monthStart || appointmentDate > monthEnd) return false;
            break;
          case 'next_month':
            const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
            nextMonthEnd.setHours(23, 59, 59, 999);
            if (appointmentDate < nextMonthStart || appointmentDate > nextMonthEnd) return false;
            break;
        }
      }

      return true;
    });

    // Apply sorting if active
    if (this.sortField && this.sortDirection) {
      this.applySorting();
    }

    // Reset to first page when filters change
    this.currentPage = 1;
  }

  // Sorting methods
  onSortChange(event: { field: SortField; direction: SortDirection }): void {
    this.sortField = event.field;
    this.sortDirection = event.direction;
    this.applySorting();
  }

  private applySorting(): void {
    if (!this.sortField || !this.sortDirection) return;

    this.filteredAppointments.sort((a: AdminAppointment, b: AdminAppointment) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortField) {
        case 'patient_name':
          aValue = a.patient_name || '';
          bValue = b.patient_name || '';
          break;
        case 'doctor_name':
          aValue = a.doctor_name || '';
          bValue = b.doctor_name || '';
          break;
        case 'appointment_date':
          aValue = new Date(a.appointment_date || a.slot_date || '');
          bValue = new Date(b.appointment_date || b.slot_date || '');
          break;
        case 'appointment_status':
          aValue = a.appointment_status || '';
          bValue = b.appointment_status || '';
          break;
        case 'visit_type':
          aValue = a.visit_type || '';
          bValue = b.visit_type || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at || '');
          bValue = new Date(b.created_at || '');
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // CRUD operations
  openViewAppointmentModal(appointment: AdminAppointment): void {
    this.selectedAppointment = { ...appointment };
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedAppointment = null;
  }

  openEditAppointmentModal(appointment: AdminAppointment): void {
    this.selectedAppointment = { ...appointment };
    this.updateError = null;
    this.isUpdating = false;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedAppointment = null;
    this.updateError = null;
    this.updateSuccess = null;
    this.validationErrors = {};
    this.isUpdating = false;
  }



  async onUpdateAppointment(appointmentData: Partial<AdminAppointment>) {
    if (!this.selectedAppointment) return;

    // Validate appointment data
    const appointmentToValidate = { ...this.selectedAppointment, ...appointmentData };
    if (!this.validateAppointmentData(appointmentToValidate)) {
      this.updateError = 'Please fix the validation errors before saving.';
      return;
    }

    this.isUpdating = true;
    this.updateError = null;
    this.updateSuccess = null;

    try {
      // Prepare update data with only editable fields
      const updateData: any = {
        visit_type: appointmentData.visit_type,
        appointment_status: appointmentData.appointment_status,
        schedule: appointmentData.schedule,
        updated_at: new Date().toISOString()
      };

      // Add optional fields only if they have values
      if (appointmentData.message) {
        updateData.message = appointmentData.message;
      }
      if (appointmentData.appointment_date) {
        updateData.appointment_date = appointmentData.appointment_date;
      }
      if (appointmentData.appointment_time) {
        updateData.appointment_time = appointmentData.appointment_time;
      }

      const result = await this.supabaseService.updateAppointment(
        this.selectedAppointment.original_id || this.selectedAppointment.appointment_id,
        updateData,
        this.selectedAppointment.appointment_type,
        this.selectedAppointment.original_table
      );

      if (result.success && 'data' in result && result.data) {
        // Update local data
        const index = this.appointments.findIndex(a =>
          a.appointment_id === this.selectedAppointment!.appointment_id ||
          a.original_id === this.selectedAppointment!.original_id
        );
        if (index !== -1) {
          // Update only the fields that were actually updated
          Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
              (this.appointments[index] as any)[key] = updateData[key];
            }
          });
          this.applyFilters(this.currentFilters);
        }

        // Show success message
        this.updateSuccess = 'Appointment updated successfully!';

        // Close modal after a brief delay to show success message
        setTimeout(() => {
          this.closeEditModal();
        }, 1500);
      } else {
        this.updateError = result.error || 'Failed to update appointment. Please try again.';
        console.error('Error updating appointment:', result.error);
      }
    } catch (error: any) {
      this.updateError = error.message || 'An unexpected error occurred. Please try again.';
      console.error('Error updating appointment:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  async onDeleteAppointment(appointment: AdminAppointment) {
    const appointmentType = appointment.appointment_type === 'guest' ? 'Guest' : 'Patient';
    if (!confirm(`Are you sure you want to delete this ${appointmentType} appointment?`)) {
      return;
    }

    try {
      const result = await this.supabaseService.deleteAppointment(
        appointment.original_id || appointment.appointment_id,
        appointment.appointment_type,
        appointment.original_table
      );

      if (result.success) {
        // Remove from local data
        this.appointments = this.appointments.filter(a =>
          a.appointment_id !== appointment.appointment_id &&
          a.original_id !== appointment.original_id
        );
        this.applyFilters(this.currentFilters);
      } else {
        console.error('Error deleting appointment:', result.error);
        // Show error message to user
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      // Show error message to user
    }
  }

  // Bulk operations
  async onBulkAction(event: { action: string; appointmentIds: string[] }): Promise<void> {
    const { action, appointmentIds } = event;

    if (appointmentIds.length === 0) return;

    try {
      if (action.startsWith('update_status_')) {
        const status = action.replace('update_status_', '');

        // Update each appointment with proper type information
        const updatePromises = appointmentIds.map((id: string) => {
          const appointment = this.appointments.find(a => a.appointment_id === id || a.original_id === id);
          if (appointment) {
            return this.supabaseService.updateAppointment(
              appointment.original_id || appointment.appointment_id,
              { appointment_status: status },
              appointment.appointment_type,
              appointment.original_table
            );
          }
          return Promise.resolve({ success: false, error: 'Appointment not found', data: undefined });
        });

        const results = await Promise.all(updatePromises);

        // Update local data for successful updates
        results.forEach((result, index) => {
          if (result.success && 'data' in result && result.data) {
            const appointmentIndex = this.appointments.findIndex((a: AdminAppointment) =>
              a.appointment_id === appointmentIds[index] || a.original_id === appointmentIds[index]
            );
            if (appointmentIndex !== -1) {
              this.appointments[appointmentIndex] = { ...this.appointments[appointmentIndex], ...result.data };
            }
          }
        });

        this.applyFilters(this.currentFilters);

      } else if (action === 'delete') {
        if (!confirm(`Are you sure you want to delete ${appointmentIds.length} appointment(s)?`)) {
          return;
        }

        // Delete each appointment with proper type information
        const deletePromises = appointmentIds.map((id: string) => {
          const appointment = this.appointments.find(a => a.appointment_id === id || a.original_id === id);
          if (appointment) {
            return this.supabaseService.deleteAppointment(
              appointment.original_id || appointment.appointment_id,
              appointment.appointment_type,
              appointment.original_table
            );
          }
          return Promise.resolve({ success: false, error: 'Appointment not found' });
        });

        const results = await Promise.all(deletePromises);

        // Remove successfully deleted appointments from local data
        results.forEach((result, index) => {
          if (result.success) {
            this.appointments = this.appointments.filter((a: AdminAppointment) =>
              a.appointment_id !== appointmentIds[index] && a.original_id !== appointmentIds[index]
            );
          }
        });

        this.applyFilters(this.currentFilters);
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      // Show error message to user
    }
  }

  // Export functionality
  exportAppointments(): void {
    const csvContent = this.generateCSV(this.filteredAppointments);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `appointments_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private generateCSV(appointments: AdminAppointment[]): string {
    const headers = [
      'Appointment ID',
      'Type',
      'Name',
      'Doctor Name',
      'Date',
      'Time',
      'Visit Type',
      'Status',
      'Phone',
      'Email',
      'Schedule',
      'Category',
      'Created At'
    ];

    const rows = appointments.map((appointment: AdminAppointment) => [
      appointment.appointment_id,
      appointment.appointment_type === 'guest' ? 'Guest' : 'Patient',
      appointment.display_name || appointment.patient_name || appointment.guest_name || 'N/A',
      appointment.doctor_name || 'Unassigned',
      appointment.appointment_date || appointment.slot_date || 'N/A',
      appointment.appointment_time || appointment.slot_time || 'N/A',
      appointment.visit_type,
      appointment.appointment_status,
      appointment.patient_phone || appointment.phone,
      appointment.patient_email || appointment.email,
      appointment.schedule || 'N/A',
      appointment.category_name || 'N/A',
      appointment.created_at || 'N/A'
    ]);

    const csvContent = [headers, ...rows]
      .map((row: string[]) => row.map((field: string) => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  // Clear filters
  clearAllFilters(): void {
    this.currentFilters = {
      query: '',
      status: '',
      visitType: '',
      doctor: '',
      dateRange: '',
      appointmentType: ''
    };
    this.applyFilters(this.currentFilters);
  }

  // Utility methods for template
  Math = Math;

  getVisiblePages(): number[] {
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    const visiblePages: number[] = [];

    if (totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      // Show smart pagination
      if (currentPage <= 4) {
        // Show first 5 pages + ... + last page
        for (let i = 1; i <= 5; i++) {
          visiblePages.push(i);
        }
        if (totalPages > 6) {
          visiblePages.push(-1); // Ellipsis
          visiblePages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 3) {
        // Show first page + ... + last 5 pages
        visiblePages.push(1);
        if (totalPages > 6) {
          visiblePages.push(-1); // Ellipsis
        }
        for (let i = totalPages - 4; i <= totalPages; i++) {
          visiblePages.push(i);
        }
      } else {
        // Show first page + ... + current-1, current, current+1 + ... + last page
        visiblePages.push(1);
        visiblePages.push(-1); // Ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          visiblePages.push(i);
        }
        visiblePages.push(-1); // Ellipsis
        visiblePages.push(totalPages);
      }
    }

    return visiblePages.filter(page => page > 0); // Remove ellipsis for now
  }

  // Validation methods
  validateAppointmentData(appointment: AdminAppointment): boolean {
    this.validationErrors = {};
    let isValid = true;

    // Validate appointment date
    if (!appointment.appointment_date) {
      this.validationErrors['appointment_date'] = 'Appointment date is required';
      isValid = false;
    } else {
      const appointmentDate = new Date(appointment.appointment_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (appointmentDate < today) {
        this.validationErrors['appointment_date'] = 'Appointment date cannot be in the past';
        isValid = false;
      }
    }

    // Validate appointment time
    if (!appointment.appointment_time) {
      this.validationErrors['appointment_time'] = 'Appointment time is required';
      isValid = false;
    } else {
      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(appointment.appointment_time)) {
        this.validationErrors['appointment_time'] = 'Please enter a valid time format (HH:MM)';
        isValid = false;
      }
    }

    // Validate visit type
    if (!appointment.visit_type) {
      this.validationErrors['visit_type'] = 'Visit type is required';
      isValid = false;
    }

    // Validate appointment status
    if (!appointment.appointment_status) {
      this.validationErrors['appointment_status'] = 'Appointment status is required';
      isValid = false;
    }

    return isValid;
  }

  // Get validation error for a specific field
  getValidationError(field: string): string | null {
    return this.validationErrors[field] || null;
  }

  // Check if a field has validation error
  hasValidationError(field: string): boolean {
    return !!this.validationErrors[field];
  }
}
