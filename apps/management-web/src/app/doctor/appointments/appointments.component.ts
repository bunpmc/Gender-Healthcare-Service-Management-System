import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../supabase.service';
import { Router } from '@angular/router';
import { ProcessStatus, VisitType } from '../../models/appointment.interface';

interface AppointmentDisplay {
  appointment_id: string;
  appointment_date: string;
  appointment_time?: string;
  appointment_status: string;
  visit_type: string;
  schedule: string;
  message?: string;
  phone: string;
  email: string;
  patient_name: string;
  category_name: string;
}

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit {
  appointments: AppointmentDisplay[] = [];
  filteredAppointments: AppointmentDisplay[] = [];
  loading = true;
  updating = false;
  error: string | null = null;
  successMessage: string | null = null;
  doctorId: string | null = null;

  // Filter properties
  searchTerm = '';
  selectedStatus = '';
  selectedDate = '';
  selectedVisitType = '';

  // Status options
  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Visit type options
  visitTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'follow-up', label: 'Follow Up' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'routine', label: 'Routine' }
  ];

  // Modal properties
  showUpdateModal = false;
  selectedAppointment: AppointmentDisplay | null = null;
  updateForm = {
    appointment_status: '',
    visit_type: '',
    message: '',
    appointment_date: '',
    appointment_time: ''
  };

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) { }

  ngOnInit() {
    this.doctorId = localStorage.getItem('doctor_id') || localStorage.getItem('staff_id');
    if (!this.doctorId) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadAppointments();
  }

  async loadAppointments() {
    try {
      this.loading = true;
      this.error = null;
      console.log('👨‍⚕️ Loading appointments for doctor:', this.doctorId);
      this.appointments = await this.supabaseService.getAppointmentsByDoctor(this.doctorId!);
      console.log('✅ Loaded appointments:', this.appointments.length);
      this.applyFilters();
    } catch (error: any) {
      this.error = error.message || 'Failed to load appointments';
      console.error('❌ Appointments error:', error);
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    this.filteredAppointments = this.appointments.filter(appointment => {
      const matchesSearch = !this.searchTerm ||
        appointment.patient_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        appointment.phone.includes(this.searchTerm) ||
        appointment.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = !this.selectedStatus ||
        appointment.appointment_status === this.selectedStatus;

      const matchesDate = !this.selectedDate ||
        appointment.appointment_date === this.selectedDate;

      const matchesVisitType = !this.selectedVisitType ||
        appointment.visit_type === this.selectedVisitType;

      return matchesSearch && matchesStatus && matchesDate && matchesVisitType;
    });
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedDate = '';
    this.selectedVisitType = '';
    this.applyFilters();
  }

  openUpdateModal(appointment: AppointmentDisplay) {
    this.selectedAppointment = appointment;
    this.updateForm = {
      appointment_status: appointment.appointment_status,
      visit_type: appointment.visit_type,
      message: appointment.message || '',
      appointment_date: appointment.appointment_date || '',
      appointment_time: appointment.appointment_time || ''
    };
    this.showUpdateModal = true;
  }

  closeUpdateModal() {
    this.showUpdateModal = false;
    this.selectedAppointment = null;
    this.error = null;
    this.successMessage = null;
    this.updating = false;
    this.updateForm = {
      appointment_status: '',
      visit_type: '',
      message: '',
      appointment_date: '',
      appointment_time: ''
    };
  }

  async updateAppointment() {
    if (!this.selectedAppointment) return;

    this.updating = true;
    this.error = null;
    this.successMessage = null;

    try {
      // Prepare update data with all fields
      const updateData: any = {
        appointment_id: this.selectedAppointment.appointment_id,
        appointment_status: this.updateForm.appointment_status as ProcessStatus,
        visit_type: this.updateForm.visit_type as VisitType,
        message: this.updateForm.message
      };

      // Add date and time if provided
      if (this.updateForm.appointment_date) {
        updateData.appointment_date = this.updateForm.appointment_date;
      }
      if (this.updateForm.appointment_time) {
        updateData.appointment_time = this.updateForm.appointment_time;
      }

      const result = await this.supabaseService.updateAppointmentStatus(
        this.selectedAppointment!.appointment_id,
        this.selectedAppointment!.appointment_type || 'patient',
        this.updateForm.appointment_status,
        this.updateForm.message
      );

      if (result.success) {
        // Update local data
        const index = this.appointments.findIndex(a => a.appointment_id === this.selectedAppointment!.appointment_id);
        if (index !== -1) {
          this.appointments[index] = {
            ...this.appointments[index],
            appointment_status: this.updateForm.appointment_status,
            visit_type: this.updateForm.visit_type,
            message: this.updateForm.message,
            appointment_date: this.updateForm.appointment_date || this.appointments[index].appointment_date,
            appointment_time: this.updateForm.appointment_time || this.appointments[index].appointment_time
          };
          this.applyFilters();
        }
      } else {
        throw new Error(result.error || 'Failed to update appointment');
      }

      this.successMessage = 'Appointment updated successfully!';

      // Close modal after a brief delay to show success message
      setTimeout(() => {
        this.closeUpdateModal();
      }, 1500);

    } catch (error: any) {
      this.error = error.message || 'Failed to update appointment';
      console.error('Update appointment error:', error);
    } finally {
      this.updating = false;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'in_progress': return 'text-purple-700 bg-purple-100 border-purple-200';
      case 'completed': return 'text-green-700 bg-green-100 border-green-200';
      case 'cancelled': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
