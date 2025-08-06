import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../supabase.service';
import { Patient } from '../../models/patient.interface';
import { Staff } from '../../models/staff.interface';

interface DashboardStats {
    todayAppointments: number;
    pendingPayments: number;
    totalPatients: number;
    activePatients: number;
    availableDoctors: number;
    pendingApprovals: number;
    totalRevenue: number;
    newPatientsThisMonth: number;
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
    selector: 'app-dashboard-responsive',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <!-- Modern Header -->
        <div class="bg-gradient-to-r from-white via-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 shadow-xl border border-white/20 backdrop-blur-sm mb-6 sm:mb-8">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div class="min-w-0 flex-1">
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 truncate">
                Reception Dashboard
              </h1>
              <p class="text-gray-600 text-sm sm:text-base">
                Welcome back! Here's your overview for today.
              </p>
            </div>
            <div class="flex-shrink-0">
              <div class="px-3 sm:px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                <p class="text-xs sm:text-sm font-medium text-indigo-700 whitespace-nowrap">
                  {{ getCurrentDate() }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="flex justify-center items-center h-64">
          <div class="relative">
            <div class="animate-spin rounded-full h-12 sm:h-16 w-12 sm:w-16 border-4 border-indigo-200"></div>
            <div class="animate-spin rounded-full h-12 sm:h-16 w-12 sm:w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="error && !loading" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div class="min-w-0 flex-1">
              <strong class="font-bold">Error!</strong>
              <span class="block sm:inline sm:ml-2 break-words">{{ error }}</span>
            </div>
            <button
              (click)="loadDashboardData()"
              class="flex-shrink-0 bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>

        <!-- Dashboard Content -->
        <div *ngIf="!loading && !error" class="space-y-6 sm:space-y-8">
          
          <!-- Stats Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            <!-- Today's Appointments -->
            <div class="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2 mb-2">
                    <div class="w-3 h-3 bg-indigo-500 rounded-full flex-shrink-0"></div>
                    <h3 class="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide truncate">
                      Today's Appointments
                    </h3>
                  </div>
                  <p class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                    {{ stats.todayAppointments }}
                  </p>
                  <p class="text-xs sm:text-sm text-indigo-600 font-medium">
                    Active today
                  </p>
                </div>
                <div class="flex-shrink-0 ml-3">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pending Payments -->
            <div class="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2 mb-2">
                    <div class="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
                    <h3 class="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide truncate">
                      Pending Payments
                    </h3>
                  </div>
                  <p class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                    {{ stats.pendingPayments }}
                  </p>
                  <p class="text-xs sm:text-sm text-yellow-600 font-medium">
                    Awaiting payment
                  </p>
                </div>
                <div class="flex-shrink-0 ml-3">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Total Patients -->
            <div class="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2 mb-2">
                    <div class="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                    <h3 class="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide truncate">
                      Total Patients
                    </h3>
                  </div>
                  <p class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                    {{ stats.totalPatients }}
                  </p>
                  <p class="text-xs sm:text-sm text-green-600 font-medium">
                    Registered
                  </p>
                </div>
                <div class="flex-shrink-0 ml-3">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Available Doctors -->
            <div class="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2 mb-2">
                    <div class="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <h3 class="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide truncate">
                      Available Doctors
                    </h3>
                  </div>
                  <p class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                    {{ stats.availableDoctors }}
                  </p>
                  <p class="text-xs sm:text-sm text-blue-600 font-medium">
                    On duty
                  </p>
                </div>
                <div class="flex-shrink-0 ml-3">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Appointments Section -->
          <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div class="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div class="min-w-0 flex-1">
                  <h2 class="text-lg sm:text-xl font-bold text-gray-900 truncate">Recent Appointments</h2>
                  <p class="text-sm text-gray-500">Latest appointment activities</p>
                </div>
                <button
                  (click)="navigateToAppointments()"
                  class="flex-shrink-0 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  View All
                </button>
              </div>
            </div>

            <div class="p-4 sm:p-6">
              <!-- Empty State -->
              <div *ngIf="recentAppointments.length === 0" class="text-center py-8 sm:py-12">
                <div class="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <p class="text-gray-500 font-medium text-sm sm:text-base">No recent appointments found.</p>
                <p class="text-xs sm:text-sm text-gray-400 mt-1">New appointments will appear here.</p>
              </div>

              <!-- Appointments List -->
              <div *ngIf="recentAppointments.length > 0" class="space-y-3 sm:space-y-4">
                <div
                  *ngFor="let appointment of recentAppointments"
                  class="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 border border-gray-100 hover:border-indigo-200 space-y-3 sm:space-y-0"
                >
                  <div class="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div class="flex-shrink-0">
                      <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                        <svg class="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                    </div>
                    <div class="min-w-0 flex-1">
                      <h3 class="text-sm sm:text-base font-bold text-gray-900 truncate">
                        {{ appointment.patient_name }}
                      </h3>
                      <p class="text-xs sm:text-sm text-gray-600 truncate">
                        with {{ appointment.doctor_name }}
                      </p>
                      <div class="flex flex-wrap items-center gap-2 mt-1">
                        <p class="text-xs text-gray-500">
                          {{ formatDate(appointment.appointment_date) }}
                        </p>
                        <p class="text-xs text-gray-500" *ngIf="appointment.appointment_time">
                          {{ formatTime(appointment.appointment_time) }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between sm:justify-end space-x-3">
                    <span
                      class="inline-flex items-center px-2 sm:px-3 py-1 rounded-lg text-xs font-bold"
                      [ngClass]="getStatusColorClass(appointment.appointment_status)"
                    >
                      {{ appointment.appointment_status | titlecase }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <button
              (click)="navigateToAppointments()"
              class="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 text-left group"
            >
              <div class="flex items-center space-x-4">
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-sm sm:text-base font-bold text-gray-900">Manage Appointments</h3>
                  <p class="text-xs sm:text-sm text-gray-500 mt-1">Schedule and manage appointments</p>
                </div>
              </div>
            </button>

            <button
              (click)="navigateToPatientManagement()"
              class="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 text-left group"
            >
              <div class="flex items-center space-x-4">
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-sm sm:text-base font-bold text-gray-900">Patient Management</h3>
                  <p class="text-xs sm:text-sm text-gray-500 mt-1">Register and manage patients</p>
                </div>
              </div>
            </button>

            <button
              (click)="navigateToPaymentManagement()"
              class="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 text-left group"
            >
              <div class="flex items-center space-x-4">
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-sm sm:text-base font-bold text-gray-900">Payment Management</h3>
                  <p class="text-xs sm:text-sm text-gray-500 mt-1">Handle payments and billing</p>
                </div>
              </div>
            </button>
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

    .group:hover .group-hover\\:scale-110 {
      transform: scale(1.1);
    }

    /* Responsive text utilities */
    @media (max-width: 640px) {
      .text-responsive {
        font-size: 0.875rem;
      }
    }

    /* Container max widths */
    .container-responsive {
      max-width: 100%;
      margin: 0 auto;
      padding: 0 1rem;
    }

    @media (min-width: 640px) {
      .container-responsive {
        padding: 0 1.5rem;
      }
    }

    @media (min-width: 1024px) {
      .container-responsive {
        padding: 0 2rem;
      }
    }

    /* Prevent text overflow */
    .text-overflow-safe {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Responsive grid adjustments */
    @media (max-width: 640px) {
      .stats-grid {
        grid-template-columns: repeat(1, minmax(0, 1fr));
        gap: 1rem;
      }
    }

    @media (min-width: 640px) and (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1.5rem;
      }
    }
  `]
})
export class DashboardResponsiveComponent implements OnInit, OnDestroy {
    loading = true;
    error: string | null = null;

    stats: DashboardStats = {
        todayAppointments: 0,
        pendingPayments: 0,
        totalPatients: 0,
        activePatients: 0,
        availableDoctors: 0,
        pendingApprovals: 0,
        totalRevenue: 0,
        newPatientsThisMonth: 0,
    };

    recentAppointments: RecentAppointment[] = [];
    patients: Patient[] = [];
    doctors: Staff[] = [];
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
                this.patients = result.data;
            }
        } catch (error) {
            console.error('Error loading patients:', error);
        }
    }

    async loadDoctors(): Promise<void> {
        try {
            const result = await this.supabaseService.getAllStaff();
            if (result.success && result.data) {
                this.doctors = result.data.filter((staff) => staff.role === 'doctor');
            }
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
    }

    async calculateStats(): Promise<void> {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        // Calculate today's appointments from real data
        const todayAppointments = this.recentAppointments.filter(
            (apt) => apt.appointment_date === todayString
        ).length;

        // Calculate pending appointments
        const pendingApprovals = this.recentAppointments.filter(
            (apt) => apt.appointment_status === 'pending'
        ).length;

        this.stats = {
            totalPatients: this.patients.length,
            activePatients: this.patients.filter((p) => p.patient_status === 'active').length,
            availableDoctors: this.doctors.filter((d) => d.status === 'active').length,
            todayAppointments,
            pendingApprovals,
            pendingPayments: pendingApprovals, // Using pending appointments as proxy for pending payments
            totalRevenue: 0, // Calculate from payment data if available
            newPatientsThisMonth: this.patients.filter(p => {
                const patientMonth = new Date(p.created_at || '').getMonth();
                return patientMonth === today.getMonth();
            }).length,
        };
    }

    async loadRecentAppointments(): Promise<void> {
        try {
            // Get recent appointments from Supabase
            const appointmentsResult = await this.supabaseService.getAllAppointments();

            if (appointmentsResult && appointmentsResult.success && appointmentsResult.data && appointmentsResult.data.length > 0) {
                // Transform appointments data for display
                this.recentAppointments = appointmentsResult.data
                    .slice(0, 6) // Get latest 6 appointments
                    .map((apt: any) => ({
                        appointment_id: apt.appointment_id || apt.guest_appointment_id,
                        patient_name: apt.patient?.full_name || apt.guest?.full_name || 'Unknown Patient',
                        doctor_name: apt.doctor?.staff?.full_name || 'Unknown Doctor',
                        appointment_date: apt.appointment_date,
                        appointment_time: apt.appointment_time,
                        appointment_status: apt.appointment_status,
                        visit_type: apt.visit_type,
                        type: apt.patient ? 'patient' : 'guest',
                    }));
            } else {
                this.recentAppointments = [];
            }
        } catch (error) {
            console.error('Error loading recent appointments:', error);
            this.recentAppointments = [];
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

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('vi-VN');
    }

    getStatusColorClass(status: string): string {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'in_progress':
                return 'bg-purple-100 text-purple-800 border border-purple-200';
            case 'completed':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'confirmed':
                return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
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

    getCurrentDate(): string {
        const today = new Date();
        return today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
}
