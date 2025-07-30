import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

interface Appointment {
  appointment_id: string;
  patient_name: string;
  patient_phone: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  visit_type: string;
  appointment_status: string;
  notes?: string;
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <!-- Header Background -->
      <div class="bg-gradient-to-r from-indigo-600 via-purple-700 to-pink-800 h-32 relative overflow-hidden">
        <div class="absolute inset-0 bg-black opacity-10"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent"></div>
      </div>

      <div class="relative -mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <!-- Page Header -->
        <div class="bg-white rounded-xl shadow-xl p-6 mb-8">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Appointment Management
              </h1>
              <p class="mt-2 text-gray-600">Schedule and manage patient appointments</p>
            </div>
            <div class="mt-4 md:mt-0 flex space-x-3">
              <button
                (click)="toggleView()"
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                {{ viewMode === 'list' ? 'Calendar View' : 'List View' }}
              </button>
              <button
                (click)="openNewAppointmentModal()"
                class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium">
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                New Appointment
              </button>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                [(ngModel)]="filters.date"
                (change)="applyFilters()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
              <select
                [(ngModel)]="filters.doctor"
                (change)="applyFilters()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">All Doctors</option>
                <option value="Dr. Smith">Dr. Smith</option>
                <option value="Dr. Johnson">Dr. Johnson</option>
                <option value="Dr. Williams">Dr. Williams</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                [(ngModel)]="filters.status"
                (change)="applyFilters()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                [(ngModel)]="filters.search"
                (input)="applyFilters()"
                placeholder="Patient name or phone"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>

        <!-- Appointments List -->
        <div *ngIf="!loading && viewMode === 'list'" class="bg-white rounded-xl shadow-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Appointments ({{ filteredAppointments.length }})</h2>
          </div>

          <div *ngIf="filteredAppointments.length === 0" class="p-8 text-center text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p>No appointments found matching your criteria.</p>
          </div>

          <div *ngIf="filteredAppointments.length > 0" class="divide-y divide-gray-200">
            <div *ngFor="let appointment of filteredAppointments"
                 class="p-6 hover:bg-gray-50 transition-colors">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-4">
                    <div class="flex-shrink-0">
                      <div class="h-12 w-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                    </div>
                    <div class="flex-1">
                      <h3 class="text-lg font-medium text-gray-900">{{ appointment.patient_name }}</h3>
                      <p class="text-sm text-gray-500">{{ appointment.patient_phone }}</p>
                      <div class="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                        <span>{{ appointment.doctor_name }}</span>
                        <span>•</span>
                        <span>{{ appointment.visit_type | titlecase }}</span>
                        <span>•</span>
                        <span>{{ formatDate(appointment.appointment_date) }} at {{ appointment.appointment_time }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex items-center space-x-4">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                        [ngClass]="getStatusColor(appointment.appointment_status)">
                    {{ appointment.appointment_status | titlecase }}
                  </span>
                  <div class="flex space-x-2">
                    <button
                      (click)="editAppointment(appointment)"
                      class="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button
                      (click)="deleteAppointment(appointment)"
                      class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Calendar View Placeholder -->
        <div *ngIf="!loading && viewMode === 'calendar'" class="bg-white rounded-xl shadow-lg p-8">
          <div class="text-center text-gray-500">
            <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Calendar View</h3>
            <p>Calendar view will be implemented in the next phase.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class AppointmentsComponent implements OnInit {
  loading = true;
  viewMode: 'list' | 'calendar' = 'list';

  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];

  filters = {
    date: '',
    doctor: '',
    status: '',
    search: ''
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loadAppointments();
    this.checkQueryParams();
  }

  checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new') {
        this.openNewAppointmentModal();
      }
    });
  }

  async loadAppointments(): Promise<void> {
    try {
      this.loading = true;

      // Simulate API call with demo data
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.appointments = [
        {
          appointment_id: '1',
          patient_name: 'John Smith',
          patient_phone: '+1 (555) 123-4567',
          doctor_name: 'Dr. Smith',
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: '09:00',
          visit_type: 'consultation',
          appointment_status: 'confirmed'
        },
        {
          appointment_id: '2',
          patient_name: 'Sarah Johnson',
          patient_phone: '+1 (555) 987-6543',
          doctor_name: 'Dr. Johnson',
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: '10:30',
          visit_type: 'follow-up',
          appointment_status: 'pending'
        },
        {
          appointment_id: '3',
          patient_name: 'Michael Brown',
          patient_phone: '+1 (555) 456-7890',
          doctor_name: 'Dr. Williams',
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: '14:00',
          visit_type: 'consultation',
          appointment_status: 'confirmed'
        }
      ];

      this.filteredAppointments = [...this.appointments];

    } catch (error) {
      console.error('❌ Error loading appointments:', error);
    } finally {
      this.loading = false;
    }
  }

  toggleView(): void {
    this.viewMode = this.viewMode === 'list' ? 'calendar' : 'list';
  }

  applyFilters(): void {
    this.filteredAppointments = this.appointments.filter(appointment => {
      const matchesDate = !this.filters.date || appointment.appointment_date === this.filters.date;
      const matchesDoctor = !this.filters.doctor || appointment.doctor_name === this.filters.doctor;
      const matchesStatus = !this.filters.status || appointment.appointment_status === this.filters.status;
      const matchesSearch = !this.filters.search ||
        appointment.patient_name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        appointment.patient_phone.includes(this.filters.search);

      return matchesDate && matchesDoctor && matchesStatus && matchesSearch;
    });
  }

  openNewAppointmentModal(): void {
    console.log('📅 Opening new appointment modal');
    // TODO: Implement new appointment modal
  }

  editAppointment(appointment: Appointment): void {
    console.log('✏️ Editing appointment:', appointment.appointment_id);
    // TODO: Implement edit appointment modal
  }

  deleteAppointment(appointment: Appointment): void {
    console.log('🗑️ Deleting appointment:', appointment.appointment_id);
    // TODO: Implement delete confirmation
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
