import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../supabase.service';
import { CssChartsComponent } from './css-charts.component';

// Analytics interfaces
interface AnalyticsData {
  patientStats: PatientAnalytics;
  staffStats: StaffAnalytics;
  appointmentStats: AppointmentAnalytics;
  revenueStats: RevenueAnalytics;
  systemStats: SystemAnalytics;
}

interface PatientAnalytics {
  totalPatients: number;
  newPatientsThisMonth: number;
  patientGrowthRate: number;
  ageDistribution: { ageGroup: string; count: number }[];
  genderDistribution: { gender: string; count: number }[];
  monthlyGrowth: { month: string; count: number }[];
}

interface StaffAnalytics {
  totalStaff: number;
  activeStaff: number;
  staffUtilization: number;
  appointmentsPerStaff: { staffName: string; appointments: number }[];
  staffPerformance: { staffId: string; rating: number; appointments: number }[];
}

interface AppointmentAnalytics {
  totalAppointments: number;
  completionRate: number;
  cancellationRate: number;
  appointmentTrends: { date: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  timeSlotPopularity: { timeSlot: string; count: number }[];
}

interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowthRate: number;
  revenueByService: { service: string; revenue: number }[];
  monthlyTrends: { month: string; revenue: number }[];
  paymentStatus: { status: string; amount: number }[];
}

interface SystemAnalytics {
  totalLogins: number;
  activeUsers: number;
  peakUsageHours: { hour: string; users: number }[];
  userActivity: { date: string; activity: number }[];
}

interface KPICard {
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
  loading: boolean;
}

@Component({
  selector: 'app-analytics-content',
  standalone: true,
  imports: [CommonModule, FormsModule, CssChartsComponent],
  template: `
    <!-- Loading State -->
    <div *ngIf="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="relative">
          <div class="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-6"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Loading Analytics</h3>
        <p class="text-gray-600">Fetching comprehensive data insights...</p>
      </div>
    </div>

    <!-- Error State -->
    <div *ngIf="hasError && !isLoading" class="flex items-center justify-center min-h-96">
      <div class="text-center max-w-md">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Unable to Load Analytics</h3>
        <p class="text-gray-600 mb-4">{{ errorMessage }}</p>
        <button
          (click)="retryLoadData()"
          class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300">
          Try Again
        </button>
      </div>
    </div>

    <!-- Analytics Dashboard -->
    <div *ngIf="!isLoading && !hasError" class="space-y-8 animate-fadeIn">
      <!-- Header Section -->
      <div class="bg-gradient-to-r from-white via-indigo-50 to-purple-50 rounded-3xl p-8 shadow-2xl border border-white/30 backdrop-blur-sm">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div class="mb-4 lg:mb-0">
            <h1 class="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Healthcare Analytics Dashboard
            </h1>
            <p class="text-gray-600 text-lg">Comprehensive insights and performance metrics</p>
            <div class="flex items-center mt-2 text-sm text-gray-500">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Last updated: {{ lastUpdated }}
            </div>
          </div>
          <div class="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <!-- Date Range Selector -->
            <div class="flex items-center space-x-2">
              <label class="text-sm font-medium text-gray-700">Period:</label>
              <select
                [(ngModel)]="selectedPeriod"
                (change)="onPeriodChange()"
                class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 3 Months</option>
                <option value="1y">Last Year</option>
              </select>
            </div>
            <button
              (click)="refreshData()"
              [disabled]="isRefreshing"
              class="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 flex items-center space-x-2">
              <svg class="w-4 h-4" [class.animate-spin]="isRefreshing" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>{{ isRefreshing ? 'Refreshing...' : 'Refresh' }}</span>
            </button>
            <button
              (click)="exportReport()"
              class="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div *ngFor="let kpi of kpiCards; trackBy: trackByKpiTitle"
             class="bg-white rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div class="flex items-center justify-between mb-4">
            <div [class]="'w-12 h-12 rounded-xl flex items-center justify-center ' + kpi.color">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="kpi.icon"></path>
              </svg>
            </div>
            <div *ngIf="!kpi.loading" [class]="'px-2 py-1 rounded-lg text-xs font-medium ' + getChangeColorClass(kpi.changeType)">
              {{ kpi.change }}
            </div>
            <div *ngIf="kpi.loading" class="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
          </div>
          <div class="space-y-2">
            <h3 class="text-sm font-medium text-gray-600">{{ kpi.title }}</h3>
            <div *ngIf="!kpi.loading" class="text-3xl font-bold text-gray-900">{{ kpi.value }}</div>
            <div *ngIf="kpi.loading" class="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Analytics Charts</h2>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
            <span class="text-sm text-gray-600">Real-time Data</span>
          </div>
        </div>
        <app-css-charts></app-css-charts>
      </div>



      <!-- Detailed Analytics Sections -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <!-- Patient Demographics - Only show if we have actual patient data -->
        <div *ngIf="hasPatientDemographicData()" class="bg-white rounded-2xl p-6 shadow-xl border border-white/20">
          <h2 class="text-xl font-bold text-gray-900 mb-6">Patient Demographics</h2>
          <div class="space-y-4">
            <div *ngIf="getAgeDistributionArray().length > 0">
              <h3 class="text-sm font-medium text-gray-600 mb-3">Age Distribution</h3>
              <div class="space-y-2">
                <div *ngFor="let item of getAgeDistributionArray()" class="flex items-center justify-between">
                  <span class="text-sm text-gray-700">{{ item.ageGroup }}</span>
                  <span class="text-sm font-medium text-gray-900">{{ item.count }}</span>
                </div>
              </div>
            </div>
            <div *ngIf="getGenderDistributionArray().length > 0">
              <h3 class="text-sm font-medium text-gray-600 mb-3">Gender Distribution</h3>
              <div class="space-y-2">
                <div *ngFor="let item of getGenderDistributionArray()" class="flex items-center justify-between">
                  <span class="text-sm text-gray-700">{{ item.gender }}</span>
                  <span class="text-sm font-medium text-gray-900">{{ item.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- System Usage -->
        <div class="bg-white rounded-2xl p-6 shadow-xl border border-white/20">
          <h2 class="text-xl font-bold text-gray-900 mb-6">System Usage</h2>
          <div class="space-y-6">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600">Active Users</span>
                <span class="text-lg font-bold text-indigo-600">{{ analyticsData?.systemStats?.activeUsers || 0 }}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-indigo-600 h-2 rounded-full" [style.width.%]="getUsagePercentage()"></div>
              </div>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-600 mb-3">Peak Usage Hours</h3>
              <div class="space-y-2">
                <div class="text-sm text-gray-600">9:00 AM - 11:00 AM: Peak activity</div>
                <div class="text-sm text-gray-600">2:00 PM - 4:00 PM: High activity</div>
                <div class="text-sm text-gray-600">6:00 PM - 8:00 PM: Moderate activity</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="bg-white rounded-2xl p-6 shadow-xl border border-white/20">
          <h2 class="text-xl font-bold text-gray-900 mb-6">Quick Statistics</h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p class="text-sm font-medium text-blue-900">Completion Rate</p>
                <p class="text-xs text-blue-600">Appointments</p>
              </div>
              <div class="text-2xl font-bold text-blue-600">{{ getCompletionRate() }}%</div>
            </div>
            <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p class="text-sm font-medium text-green-900">Staff Utilization</p>
                <p class="text-xs text-green-600">Average</p>
              </div>
              <div class="text-2xl font-bold text-green-600">{{ getStaffUtilization() }}%</div>
            </div>
            <div class="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <p class="text-sm font-medium text-purple-900">Revenue Growth</p>
                <p class="text-xs text-purple-600">This Month</p>
              </div>
              <div class="text-2xl font-bold text-purple-600">+{{ getRevenueGrowth() }}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fadeIn {
      animation: fadeIn 0.6s ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Chart container animations */
    canvas {
      animation: chartFadeIn 0.8s ease-in-out;
    }

    @keyframes chartFadeIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* KPI card hover effects */
    .hover\\:scale-105:hover {
      transform: scale(1.05);
      transition: transform 0.3s ease-in-out;
    }

    /* Loading spinner enhancement */
    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    /* Pulse animation for loading states */
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    /* Smooth transitions for all interactive elements */
    button, select, .hover\\:shadow-2xl {
      transition: all 0.3s ease-in-out;
    }

    /* Custom scrollbar for better UX */
    ::-webkit-scrollbar {
      width: 6px;
    }

    ::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class AnalyticsContentComponent implements OnInit, OnDestroy {
  private supabaseService = inject(SupabaseService);

  // Component state
  isLoading: boolean = true;
  isRefreshing: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  lastUpdated: string = '';
  selectedPeriod: string = '30d';

  // Analytics data
  analyticsData: AnalyticsData | null = null;

  // KPI Cards
  kpiCards: KPICard[] = [
    {
      title: 'Total Patients',
      value: 0,
      change: '+0%',
      changeType: 'neutral',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      loading: true
    },
    {
      title: 'Monthly Revenue',
      value: 0,
      change: '+0%',
      changeType: 'neutral',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      loading: true
    },
    {
      title: 'Appointments',
      value: 0,
      change: '+0%',
      changeType: 'neutral',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      loading: true
    },
    {
      title: 'Staff Utilization',
      value: 0,
      change: '+0%',
      changeType: 'neutral',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      loading: true
    }
  ];

  ngOnInit() {
    this.loadAnalyticsData();
    this.updateLastUpdated();
  }

  async loadAnalyticsData(): Promise<void> {
    try {
      this.isLoading = true;
      this.hasError = false;

      console.log('🔄 Loading analytics data from Supabase...');

      // Fetch real data from Supabase using new methods
      const [
        patients,
        staff,
        monthlyPatientGrowth,
        monthlyRevenue,
        ageDistribution,
        genderDistribution,
        appointmentStatusDistribution
      ] = await Promise.all([
        this.supabaseService.getPatients(1, 1000),
        this.supabaseService.getStaffMembers(),
        this.supabaseService.getMonthlyPatientGrowth(6),
        this.supabaseService.getMonthlyRevenue(6),
        this.supabaseService.getAgeDistribution(),
        this.supabaseService.getGenderDistribution(),
        this.supabaseService.getAppointmentStatusDistribution()
      ]);

      console.log('✅ Successfully fetched analytics data from database');

      // Process and calculate analytics data
      this.analyticsData = await this.processAnalyticsData(
        patients,
        staff,
        monthlyPatientGrowth,
        monthlyRevenue,
        ageDistribution,
        genderDistribution,
        appointmentStatusDistribution
      );

      // Update KPI cards
      this.updateKPICards();

      this.updateLastUpdated();
      this.isLoading = false;

    } catch (error: any) {
      console.error('❌ Error loading analytics data:', error);
      this.hasError = true;
      this.errorMessage = error.message || 'Failed to load analytics data from database. Please try again.';
      this.isLoading = false;
    }
  }

  private async processAnalyticsData(
    patients: any,
    staff: any[],
    monthlyPatientGrowth: any[],
    monthlyRevenue: any[],
    ageDistribution: any,
    genderDistribution: any,
    appointmentStatusDistribution: any[]
  ): Promise<AnalyticsData> {
    const patientList = patients.patients || [];
    const totalPatients = patients.total || patientList.length;

    // Calculate patient analytics using real data
    const patientStats: PatientAnalytics = {
      totalPatients,
      newPatientsThisMonth: this.getNewPatientsThisMonth(patientList),
      patientGrowthRate: this.calculateGrowthRate(patientList),
      ageDistribution: ageDistribution || {},
      genderDistribution: genderDistribution || {},
      monthlyGrowth: monthlyPatientGrowth || []
    };

    // Calculate staff analytics
    const staffStats: StaffAnalytics = {
      totalStaff: staff.length,
      activeStaff: staff.filter(s => s.staff_status === 'active').length,
      staffUtilization: this.calculateStaffUtilization(staff),
      appointmentsPerStaff: this.calculateAppointmentsPerStaff(staff),
      staffPerformance: this.calculateStaffPerformance(staff)
    };

    // Real appointment data from Supabase
    const totalAppointments = appointmentStatusDistribution.reduce((sum, item) => sum + item.value, 0);
    const completedAppointments = appointmentStatusDistribution.find(item => item.name === 'Completed')?.value || 0;
    const cancelledAppointments = appointmentStatusDistribution.find(item => item.name === 'Cancelled')?.value || 0;

    const appointmentStats: AppointmentAnalytics = {
      totalAppointments,
      completionRate: totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0,
      cancellationRate: totalAppointments > 0 ? Math.round((cancelledAppointments / totalAppointments) * 100) : 0,
      appointmentTrends: this.generateAppointmentTrends(),
      statusDistribution: appointmentStatusDistribution.map(item => ({
        status: item.name,
        count: item.value
      })),
      timeSlotPopularity: this.generateTimeSlotData()
    };

    // Real revenue analytics from Supabase
    const totalRevenue = monthlyRevenue.reduce((sum, item) => sum + item.value, 0);
    const currentMonthRevenue = monthlyRevenue.length > 0 ? monthlyRevenue[monthlyRevenue.length - 1].value : 0;
    const previousMonthRevenue = monthlyRevenue.length > 1 ? monthlyRevenue[monthlyRevenue.length - 2].value : 0;
    const revenueGrowthRate = previousMonthRevenue > 0 ?
      Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100) : 0;

    const revenueStats: RevenueAnalytics = {
      totalRevenue,
      monthlyRevenue: currentMonthRevenue,
      revenueGrowthRate,
      revenueByService: this.generateRevenueByService(),
      monthlyTrends: monthlyRevenue,
      paymentStatus: [
        { status: 'Paid', amount: Math.round(totalRevenue * 0.85) },
        { status: 'Pending', amount: Math.round(totalRevenue * 0.12) },
        { status: 'Overdue', amount: Math.round(totalRevenue * 0.03) }
      ]
    };

    // System analytics
    const systemStats: SystemAnalytics = {
      totalLogins: 1250,
      activeUsers: staff.filter(s => s.staff_status === 'active').length + Math.floor(totalPatients * 0.3),
      peakUsageHours: this.generatePeakUsageData(),
      userActivity: this.generateUserActivityData()
    };

    return {
      patientStats,
      staffStats,
      appointmentStats,
      revenueStats,
      systemStats
    };
  }

  private updateKPICards(): void {
    if (!this.analyticsData) return;

    this.kpiCards[0] = {
      ...this.kpiCards[0],
      value: this.formatNumber(this.analyticsData.patientStats.totalPatients),
      change: `+${this.analyticsData.patientStats.patientGrowthRate.toFixed(1)}%`,
      changeType: this.analyticsData.patientStats.patientGrowthRate > 0 ? 'increase' : 'decrease',
      loading: false
    };

    this.kpiCards[1] = {
      ...this.kpiCards[1],
      value: this.formatCurrency(this.analyticsData.revenueStats.monthlyRevenue),
      change: `+${this.analyticsData.revenueStats.revenueGrowthRate.toFixed(1)}%`,
      changeType: this.analyticsData.revenueStats.revenueGrowthRate > 0 ? 'increase' : 'decrease',
      loading: false
    };

    this.kpiCards[2] = {
      ...this.kpiCards[2],
      value: this.formatNumber(this.analyticsData.appointmentStats.totalAppointments),
      change: `${this.analyticsData.appointmentStats.completionRate}% completion`,
      changeType: this.analyticsData.appointmentStats.completionRate > 80 ? 'increase' : 'decrease',
      loading: false
    };

    this.kpiCards[3] = {
      ...this.kpiCards[3],
      value: `${this.analyticsData.staffStats.staffUtilization.toFixed(1)}%`,
      change: `${this.analyticsData.staffStats.activeStaff}/${this.analyticsData.staffStats.totalStaff} active`,
      changeType: this.analyticsData.staffStats.staffUtilization > 70 ? 'increase' : 'neutral',
      loading: false
    };
  }



  // Event handlers
  async refreshData(): Promise<void> {
    this.isRefreshing = true;
    await this.loadAnalyticsData();
    this.isRefreshing = false;
  }

  retryLoadData(): void {
    this.hasError = false;
    this.loadAnalyticsData();
  }

  onPeriodChange(): void {
    this.loadAnalyticsData();
  }

  exportReport(): void {
    // Implement export functionality
    const reportData = {
      period: this.selectedPeriod,
      generatedAt: new Date().toISOString(),
      data: this.analyticsData
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `healthcare-analytics-${this.selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  updateLastUpdated(): void {
    this.lastUpdated = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Calculation methods
  private getNewPatientsThisMonth(patients: any[]): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return patients.filter(p => {
      const createdDate = new Date(p.created_at);
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    }).length;
  }

  private calculateGrowthRate(patients: any[]): number {
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    const currentMonthCount = patients.filter(p => new Date(p.created_at).getMonth() === currentMonth).length;
    const lastMonthCount = patients.filter(p => new Date(p.created_at).getMonth() === lastMonth).length;

    if (lastMonthCount === 0) return 100;
    return ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100;
  }

  // Unused - now using real Supabase data directly
  private calculateAgeDistribution(patients: any[]): { ageGroup: string; count: number }[] {
    const ageGroups = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '55+': 0
    };

    patients.forEach(patient => {
      if (patient.date_of_birth) {
        const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();
        if (age >= 18 && age <= 25) ageGroups['18-25']++;
        else if (age >= 26 && age <= 35) ageGroups['26-35']++;
        else if (age >= 36 && age <= 45) ageGroups['36-45']++;
        else if (age >= 46 && age <= 55) ageGroups['46-55']++;
        else if (age > 55) ageGroups['55+']++;
      }
    });

    return Object.entries(ageGroups).map(([ageGroup, count]) => ({ ageGroup, count }));
  }

  private calculateGenderDistribution(patients: any[]): { gender: string; count: number }[] {
    const genderCounts = patients.reduce((acc, patient) => {
      const gender = patient.gender || 'Not specified';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(genderCounts).map(([gender, count]) => ({ gender, count: count as number }));
  }

  private calculateMonthlyGrowth(patients: any[]): { month: string; count: number }[] {
    const monthlyData: { [key: string]: number } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = months[date.getMonth()];
      monthlyData[monthKey] = 0;
    }

    patients.forEach(patient => {
      const createdDate = new Date(patient.created_at);
      const monthKey = months[createdDate.getMonth()];
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey]++;
      }
    });

    return Object.entries(monthlyData).map(([month, count]) => ({ month, count }));
  }

  private calculateStaffUtilization(staff: any[]): number {
    const activeStaff = staff.filter(s => s.staff_status === 'active').length;
    const totalStaff = staff.length;
    return totalStaff > 0 ? (activeStaff / totalStaff) * 100 : 0;
  }

  private calculateAppointmentsPerStaff(staff: any[]): { staffName: string; appointments: number }[] {
    return staff.slice(0, 5).map(staffMember => ({
      staffName: staffMember.full_name || 'Unknown',
      appointments: Math.floor(Math.random() * 50) + 10 // Mock data
    }));
  }

  private calculateStaffPerformance(staff: any[]): { staffId: string; rating: number; appointments: number }[] {
    return staff.map(staffMember => ({
      staffId: staffMember.staff_id,
      rating: Math.random() * 2 + 3, // 3-5 rating
      appointments: Math.floor(Math.random() * 50) + 10
    }));
  }

  // Mock data generators (replace with real data when available)
  private generateAppointmentTrends(): { date: string; count: number }[] {
    const trends = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 20) + 5
      });
    }
    return trends;
  }

  private generateTimeSlotData(): { timeSlot: string; count: number }[] {
    return [
      { timeSlot: '9:00-10:00', count: 25 },
      { timeSlot: '10:00-11:00', count: 30 },
      { timeSlot: '11:00-12:00', count: 28 },
      { timeSlot: '14:00-15:00', count: 35 },
      { timeSlot: '15:00-16:00', count: 32 },
      { timeSlot: '16:00-17:00', count: 20 }
    ];
  }

  private generateRevenueByService(): { service: string; revenue: number }[] {
    return [
      { service: 'Consultation', revenue: 800000 },
      { service: 'Surgery', revenue: 1200000 },
      { service: 'Therapy', revenue: 300000 },
      { service: 'Diagnostics', revenue: 200000 }
    ];
  }

  private generateMonthlyRevenueTrends(): { month: string; revenue: number }[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      revenue: Math.floor(Math.random() * 200000) + 300000
    }));
  }

  private generatePeakUsageData(): { hour: string; users: number }[] {
    const hours = ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM'];
    return hours.map(hour => ({
      hour,
      users: Math.floor(Math.random() * 50) + 10
    }));
  }

  private generateUserActivityData(): { date: string; activity: number }[] {
    const activities = [];
    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      activities.push({
        date: date.toISOString().split('T')[0],
        activity: Math.floor(Math.random() * 100) + 50
      });
    }
    return activities;
  }

  // Utility methods
  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Template helper methods
  getChangeColorClass(changeType: 'increase' | 'decrease' | 'neutral'): string {
    switch (changeType) {
      case 'increase': return 'bg-green-100 text-green-800';
      case 'decrease': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getCompletionRate(): number {
    return this.analyticsData?.appointmentStats?.completionRate || 0;
  }

  getStaffUtilization(): number {
    return this.analyticsData?.staffStats?.staffUtilization || 0;
  }

  getRevenueGrowth(): number {
    return this.analyticsData?.revenueStats?.revenueGrowthRate || 0;
  }

  getUsagePercentage(): number {
    if (!this.analyticsData?.systemStats) return 0;
    const maxUsers = 100; // Assume max capacity
    return (this.analyticsData.systemStats.activeUsers / maxUsers) * 100;
  }

  // Helper methods for Patient Demographics section
  hasPatientDemographicData(): boolean {
    const ageData = this.getAgeDistributionArray();
    const genderData = this.getGenderDistributionArray();
    return ageData.length > 0 || genderData.length > 0;
  }

  getAgeDistributionArray(): { ageGroup: string; count: number }[] {
    const ageDistribution = this.analyticsData?.patientStats?.ageDistribution;
    if (!ageDistribution || typeof ageDistribution !== 'object') {
      return [];
    }

    // Convert object to array format
    return Object.entries(ageDistribution).map(([ageGroup, count]) => ({
      ageGroup,
      count: typeof count === 'number' ? count : Number(count) || 0
    })).filter(item => item.count > 0);
  }

  getGenderDistributionArray(): { gender: string; count: number }[] {
    const genderDistribution = this.analyticsData?.patientStats?.genderDistribution;
    if (!genderDistribution || typeof genderDistribution !== 'object') {
      return [];
    }

    // Convert object to array format
    return Object.entries(genderDistribution).map(([gender, count]) => ({
      gender: this.formatGenderName(gender),
      count: typeof count === 'number' ? count : Number(count) || 0
    })).filter(item => item.count > 0);
  }

  private formatGenderName(gender: string): string {
    const genderMap: { [key: string]: string } = {
      'male': 'Male',
      'female': 'Female',
      'other': 'Other',
      'prefer_not_to_say': 'Prefer not to say',
      'non_binary': 'Non-binary'
    };
    return genderMap[gender.toLowerCase()] || gender;
  }

  // TrackBy functions for performance
  trackByKpiTitle(_index: number, kpi: KPICard): string {
    return kpi.title;
  }

  // Cleanup
  ngOnDestroy(): void {
    // No cleanup needed for ngx-charts
  }
}
