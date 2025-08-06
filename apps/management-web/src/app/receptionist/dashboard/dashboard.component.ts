import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../supabase.service';
import { Patient } from '../../models/patient.interface';
import { Staff } from '../../models/staff.interface';
import { FormatNamePipe } from '../../utils/name.util';

interface DashboardStats {
  todayAppointments: number;
  pendingAppointments: number;
  totalPatients: number;
  availableDoctors: number;
  pendingPayments: number;
  recentAppointments: any[];
}

interface RecentAppointment {
  appointment_id: string;
  patient_name: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  appointment_status: string;
  visit_type: string;
  type: 'patient' | 'guest';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormatNamePipe],
  template: `
    <div class="max-w-full overflow-hidden">
      <!-- Header -->
      <div class="mb-6 lg:mb-8">
        <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Reception Dashboard</h1>
        <p class="text-gray-600">Welcome back! Here's your overview for today.</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !loading" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        <strong class="font-bold">Error!</strong>
        <span class="block sm:inline"> {{ error }}</span>
        <button (click)="loadDashboardData()" class="ml-4 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
          Retry
        </button>
      </div>

      <!-- Dashboard Content -->
      <div *ngIf="!loading && !error">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <!-- Today's Appointments -->
          <div class="bg-white rounded-lg shadow-md p-4 lg:p-6 border-l-4 border-blue-500">
            <div class="flex items-center">
              <div class="flex-1 min-w-0">
                <h3 class="text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-wide">Today's Appointments</h3>
                <p class="text-2xl lg:text-3xl font-bold text-gray-900">{{ stats.todayAppointments }}</p>
              </div>
              <div class="flex-shrink-0 ml-4">
                <svg class="h-6 w-6 lg:h-8 lg:w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
            </div>
          </div>

          <!-- Pending Appointments -->
          <div class="bg-white rounded-lg shadow-md p-4 lg:p-6 border-l-4 border-yellow-500">
            <div class="flex items-center">
              <div class="flex-1 min-w-0">
                <h3 class="text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-wide">Pending Appointments</h3>
                <p class="text-2xl lg:text-3xl font-bold text-gray-900">{{ stats.pendingAppointments }}</p>
              </div>
              <div class="flex-shrink-0 ml-4">
                <svg class="h-6 w-6 lg:h-8 lg:w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <!-- Total Patients -->
          <div class="bg-white rounded-lg shadow-md p-4 lg:p-6 border-l-4 border-green-500">
            <div class="flex items-center">
              <div class="flex-1 min-w-0">
                <h3 class="text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-wide">Total Patients</h3>
                <p class="text-2xl lg:text-3xl font-bold text-gray-900">{{ stats.totalPatients }}</p>
              </div>
              <div class="flex-shrink-0 ml-4">
                <svg class="h-6 w-6 lg:h-8 lg:w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
            </div>
          </div>

          <!-- Available Doctors -->
          <div class="bg-white rounded-lg shadow-md p-4 lg:p-6 border-l-4 border-purple-500">
            <div class="flex items-center">
              <div class="flex-1 min-w-0">
                <h3 class="text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-wide">Available Doctors</h3>
                <p class="text-2xl lg:text-3xl font-bold text-gray-900">{{ stats.availableDoctors }}</p>
              </div>
              <div class="flex-shrink-0 ml-4">
                <svg class="h-6 w-6 lg:h-8 lg:w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Appointments Section -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6 lg:mb-8">
          <div class="px-4 lg:px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 class="text-lg font-semibold text-gray-900">Recent Appointments</h2>
          </div>
          <div class="p-4 lg:p-6">
            <div *ngIf="stats.recentAppointments.length === 0" class="text-center py-8">
              <div class="text-gray-500 mb-4">No recent appointments found.</div>
            </div>
            <div *ngIf="stats.recentAppointments.length > 0" class="space-y-3 lg:space-y-4">
              <div *ngFor="let appointment of stats.recentAppointments"
                   class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 lg:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors space-y-3 sm:space-y-0">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                      <div class="h-8 w-8 lg:h-10 lg:w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg class="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ appointment.patient_name }}</p>
                      <p class="text-sm text-gray-500 truncate">with {{ appointment.doctor_name }}</p>
                      <p class="text-xs text-gray-400">{{ appointment.visit_type | titlecase }}</p>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                  <div class="text-left sm:text-right">
                    <p class="text-sm font-medium text-gray-900">{{ formatDate(appointment.appointment_date) }}</p>
                    <p class="text-sm text-gray-500" *ngIf="appointment.appointment_time">{{ formatTime(appointment.appointment_time) }}</p>
                  </div>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium self-start sm:self-auto"
                        [ngClass]="getStatusColor(appointment.appointment_status)">
                    {{ appointment.appointment_status | titlecase }}
                  </span>
                </div>
              </div>
            </div>
            <div *ngIf="stats.recentAppointments.length > 0" class="mt-6 text-center">
              <button (click)="navigateToAppointments()"
                      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                View All Appointments
                <svg class="ml-2 -mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <button (click)="navigateToAppointments()" 
                  class="bg-white rounded-lg shadow-md p-4 lg:p-6 text-left hover:shadow-lg transition-shadow border-l-4 border-blue-500">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 lg:h-8 lg:w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div class="ml-4 min-w-0">
                <h3 class="text-base lg:text-lg font-medium text-gray-900">Manage Appointments</h3>
                <p class="text-sm text-gray-500 mt-1">Schedule and manage appointments</p>
              </div>
            </div>
          </button>
          
          <button (click)="navigateToPatientManagement()" 
                  class="bg-white rounded-lg shadow-md p-4 lg:p-6 text-left hover:shadow-lg transition-shadow border-l-4 border-green-500">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 lg:h-8 lg:w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div class="ml-4 min-w-0">
                <h3 class="text-base lg:text-lg font-medium text-gray-900">Patient Management</h3>
                <p class="text-sm text-gray-500 mt-1">Register and manage patients</p>
              </div>
            </div>
          </button>
          
          <button (click)="navigateToPaymentManagement()" 
                  class="bg-white rounded-lg shadow-md p-4 lg:p-6 text-left hover:shadow-lg transition-shadow border-l-4 border-yellow-500 sm:col-span-2 lg:col-span-1">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 lg:h-8 lg:w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div class="ml-4 min-w-0">
                <h3 class="text-base lg:text-lg font-medium text-gray-900">Payment Management</h3>
                <p class="text-sm text-gray-500 mt-1">Handle payments and billing</p>
              </div>
            </div>
          </button>
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

    /* Responsive design improvements */
    .max-w-full {
      max-width: 100%;
    }

    /* Prevent text overflow */
    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Ensure images and content don't overflow */
    * {
      box-sizing: border-box;
    }

    /* Mobile-first responsive breakpoints */
    @media (max-width: 640px) {
      .grid {
        gap: 1rem;
      }
      
      .p-4 {
        padding: 0.75rem;
      }
      
      .text-2xl {
        font-size: 1.5rem;
      }
      
      .text-3xl {
        font-size: 1.875rem;
      }
    }

    /* Tablet breakpoint */
    @media (min-width: 641px) and (max-width: 1024px) {
      .grid {
        gap: 1.25rem;
      }
    }

    /* Desktop breakpoint */
    @media (min-width: 1025px) {
      .grid {
        gap: 1.5rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats = {
    todayAppointments: 0,
    pendingAppointments: 0,
    totalPatients: 0,
    availableDoctors: 0,
    pendingPayments: 0,
    recentAppointments: []
  };

  loading = true;
  error: string | null = null;
  refreshInterval: any;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
    // Set up real-time refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadDashboardData();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async loadDashboardData(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;

      // Load real data from Supabase
      await Promise.all([
        this.loadPatients(),
        this.loadDoctors(),
        this.loadRecentAppointments(),
      ]);

      // Calculate stats after loading all data
      await this.calculateStats();
    } catch (error: any) {
      console.error('❌ Error loading dashboard data:', error);
      this.error = 'Failed to load dashboard data. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  async loadPatients(): Promise<void> {
    try {
      const result = await this.supabaseService.getAllPatients();
      if (result.success && result.data) {
        this.stats.totalPatients = result.data.length;
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  }

  async loadDoctors(): Promise<void> {
    try {
      const result = await this.supabaseService.getAllStaff();
      if (result.success && result.data) {
        const doctors = result.data.filter((staff: Staff) => staff.role === 'doctor');
        this.stats.availableDoctors = doctors.filter((d: Staff) => d.status === 'active').length;
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  }

  async calculateStats(): Promise<void> {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Calculate today's appointments from real data
    const todayAppointments = this.stats.recentAppointments.filter(
      (apt) => apt.appointment_date === todayString
    ).length;

    // Calculate pending appointments
    const pendingAppointments = this.stats.recentAppointments.filter(
      (apt) => apt.appointment_status === 'pending'
    ).length;

    this.stats.todayAppointments = todayAppointments;
    this.stats.pendingAppointments = pendingAppointments;
    this.stats.pendingPayments = pendingAppointments; // Using pending appointments as proxy for pending payments
  }

  async loadRecentAppointments(): Promise<void> {
    try {
      const appointmentsResult = await this.supabaseService.getAllAppointmentsForReceptionist();

      if (appointmentsResult && appointmentsResult.success && appointmentsResult.data && appointmentsResult.data.length > 0) {
        // Use the transformed data directly - service already provides patient_name and doctor_name
        this.stats.recentAppointments = appointmentsResult.data
          .slice(0, 10)
          .map((apt: any) => ({
            appointment_id: apt.appointment_id,
            patient_name: apt.patient_name || 'Unknown Patient',
            doctor_name: apt.doctor_name || 'Unknown Doctor',
            appointment_date: apt.appointment_date,
            appointment_time: apt.appointment_time,
            appointment_status: apt.appointment_status,
            visit_type: apt.visit_type || 'General Consultation',
            type: apt.appointment_type || (apt.patient_id ? 'patient' : 'guest'),
          }));
      } else {
        this.stats.recentAppointments = [];
      }
    } catch (error) {
      console.error('Error loading recent appointments:', error);
      this.stats.recentAppointments = [];
    }
  }

  navigateToAppointments(): void {
    this.router.navigate(['/receptionist/dashboard/appointment-management']);
  }

  navigateToPatientManagement(): void {
    this.router.navigate(['/receptionist/dashboard/patient-management']);
  }

  navigateToPaymentManagement(): void {
    this.router.navigate(['/receptionist/dashboard/payment-management']);
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'in_progress':
        return 'text-purple-600 bg-purple-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timeString;
    }
  }
}

export default DashboardComponent;
