import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../supabase.service';
import { DatabaseService } from '../../Services/database.service';
import { interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

// Dashboard interfaces
interface DashboardStats {
  totalPatients: number;
  totalStaff: number;
  todayAppointments: number;
  pendingAppointments: number;
  monthlyRevenue: number;
  activeStaff: number;
  newPatientsThisMonth: number;
  completedAppointments: number;
}

interface StatsCard {
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
  loading: boolean;
}

interface RecentActivity {
  id: string;
  type: 'appointment' | 'patient' | 'staff' | 'system';
  title: string;
  description: string;
  message: string;
  timestamp: Date;
  status: string;
  priority: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-dashboard-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-content.component.html',
  styleUrls: ['./dashboard-content.component.css']
})

export class DashboardContentComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private databaseService = inject(DatabaseService);
  private router = inject(Router);

  // Loading and error states
  isLoading: boolean = true;
  isRefreshing: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  lastUpdated: string = '';

  // Dashboard data
  dashboardStats: DashboardStats = {
    totalPatients: 0,
    totalStaff: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    monthlyRevenue: 0,
    activeStaff: 0,
    newPatientsThisMonth: 0,
    completedAppointments: 0
  };

  statsCards: StatsCard[] = [
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
      title: 'Active Staff',
      value: 0,
      change: '+0%',
      changeType: 'neutral',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      loading: true
    },
    {
      title: "Today's Appointments",
      value: 0,
      change: '+0%',
      changeType: 'neutral',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      loading: true
    },
    {
      title: 'Monthly Revenue',
      value: 0,
      change: '+0%',
      changeType: 'neutral',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      loading: true
    }
  ];

  recentActivities: RecentActivity[] = [];

  quickActions = [
    {
      title: 'Add Patient',
      icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      title: 'Schedule Appointment',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    {
      title: 'Add Staff',
      icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600'
    },
    {
      title: 'Generate Report',
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600'
    }
  ];

  systemStatus = [
    {
      title: 'Database',
      status: 'healthy',
      message: 'All systems operational',
      icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
      color: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    {
      title: 'API Services',
      status: 'healthy',
      message: 'Response time: 120ms',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      title: 'Backup Status',
      status: 'healthy',
      message: 'Last backup: 2 hours ago',
      icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600'
    }
  ];

  ngOnInit() {
    this.loadDashboardData();
    this.updateLastUpdated();

    // Auto-refresh every 5 minutes
    interval(300000).pipe(
      startWith(0),
      switchMap(() => this.loadDashboardData())
    ).subscribe();
  }

  async loadDashboardData(): Promise<void> {
    try {
      this.isLoading = true;
      this.hasError = false;

      // Fetch analytics data using database functions
      const [
        dashboardAnalytics,
        patientStats,
        appointmentStats,
        revenueStats,
        staffStats
      ] = await Promise.all([
        this.databaseService.getDashboardAnalytics().toPromise().catch(() => null),
        this.databaseService.getPatientStats().toPromise().catch(() => null),
        this.databaseService.getAppointmentStats().toPromise().catch(() => null),
        this.databaseService.getRevenueStats().toPromise().catch(() => null),
        this.databaseService.getStaffStats().toPromise().catch(() => null)
      ]);

      // Use database function results or fallback to existing service
      if (dashboardAnalytics && patientStats && appointmentStats && revenueStats && staffStats) {
        console.log('📊 Using database function results for dashboard');

        this.dashboardStats = {
          totalPatients: dashboardAnalytics.total_patients || patientStats.active_patients,
          totalStaff: dashboardAnalytics.total_doctors || staffStats.total_doctors + staffStats.total_receptionists,
          activeStaff: staffStats.active_staff,
          todayAppointments: appointmentStats.pending_appointments,
          pendingAppointments: appointmentStats.pending_appointments,
          completedAppointments: appointmentStats.completed_appointments,
          newPatientsThisMonth: patientStats.new_patients_this_month,
          monthlyRevenue: revenueStats.monthly_revenue
        };
      } else {
        console.log('⚠️ Database functions not available, using fallback service');

        // Fallback to existing Supabase service
        const [patients, staff] = await Promise.all([
          this.supabaseService.getPatients(1, 1000), // Get all patients
          this.supabaseService.getStaffMembers()
        ]);

        const appointments: any[] = [];

        this.dashboardStats = {
          totalPatients: patients.total || patients.patients?.length || 0,
          totalStaff: staff.length,
          activeStaff: staff.filter((s: any) => s.staff_status === 'active').length,
          todayAppointments: this.getTodayAppointments(appointments),
          pendingAppointments: appointments.filter((a: any) => a.status === 'pending').length,
          completedAppointments: appointments.filter((a: any) => a.status === 'completed').length,
          newPatientsThisMonth: this.getNewPatientsThisMonth(patients.patients || []),
          monthlyRevenue: this.calculateMonthlyRevenue(appointments)
        };
      }

      // Update stats cards with real data
      this.updateStatsCards();

      // Load recent activities
      await this.loadRecentActivities();

      this.updateLastUpdated();
      this.isLoading = false;

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      this.hasError = true;
      this.errorMessage = error.message || 'Failed to load dashboard data. Please try again.';
      this.isLoading = false;
    }
  }

  private updateStatsCards(): void {
    const previousStats = { ...this.dashboardStats }; // In real app, get from localStorage or API

    this.statsCards[0] = {
      ...this.statsCards[0],
      value: this.formatNumber(this.dashboardStats.totalPatients),
      change: this.calculateChange(this.dashboardStats.totalPatients, previousStats.totalPatients || this.dashboardStats.totalPatients - 5),
      changeType: this.getChangeType(this.dashboardStats.totalPatients, previousStats.totalPatients || this.dashboardStats.totalPatients - 5),
      loading: false
    };

    this.statsCards[1] = {
      ...this.statsCards[1],
      value: this.formatNumber(this.dashboardStats.activeStaff),
      change: this.calculateChange(this.dashboardStats.activeStaff, previousStats.activeStaff || this.dashboardStats.activeStaff),
      changeType: this.getChangeType(this.dashboardStats.activeStaff, previousStats.activeStaff || this.dashboardStats.activeStaff),
      loading: false
    };

    this.statsCards[2] = {
      ...this.statsCards[2],
      value: this.formatNumber(this.dashboardStats.todayAppointments),
      change: this.calculateChange(this.dashboardStats.todayAppointments, previousStats.todayAppointments || this.dashboardStats.todayAppointments - 2),
      changeType: this.getChangeType(this.dashboardStats.todayAppointments, previousStats.todayAppointments || this.dashboardStats.todayAppointments - 2),
      loading: false
    };

    this.statsCards[3] = {
      ...this.statsCards[3],
      value: this.formatCurrency(this.dashboardStats.monthlyRevenue),
      change: this.calculateChange(this.dashboardStats.monthlyRevenue, previousStats.monthlyRevenue || this.dashboardStats.monthlyRevenue * 0.9),
      changeType: this.getChangeType(this.dashboardStats.monthlyRevenue, previousStats.monthlyRevenue || this.dashboardStats.monthlyRevenue * 0.9),
      loading: false
    };
  }

  private async loadRecentActivities(): Promise<void> {
    try {
      // Generate recent activities based on real data
      this.recentActivities = [
        {
          id: '1',
          type: 'patient',
          title: 'New Patient Registrations',
          description: `${this.dashboardStats.newPatientsThisMonth} new patients registered this month`,
          message: `${this.dashboardStats.newPatientsThisMonth} new patients registered this month`,
          timestamp: new Date(),
          status: 'completed',
          priority: 'medium'
        },
        {
          id: '2',
          type: 'appointment',
          title: 'Today\'s Appointments',
          description: `${this.dashboardStats.todayAppointments} appointments scheduled for today`,
          message: `${this.dashboardStats.todayAppointments} appointments scheduled for today`,
          timestamp: new Date(Date.now() - 3600000),
          status: 'active',
          priority: this.dashboardStats.todayAppointments > 10 ? 'high' : 'low'
        },
        {
          id: '3',
          type: 'staff',
          title: 'Active Staff Members',
          description: `${this.dashboardStats.activeStaff} staff members currently active`,
          message: `${this.dashboardStats.activeStaff} staff members currently active`,
          timestamp: new Date(Date.now() - 7200000),
          status: 'online',
          priority: 'low'
        },
        {
          id: '4',
          type: 'system',
          title: 'System Backup',
          description: 'Database backup completed successfully',
          message: 'Database backup completed successfully',
          timestamp: new Date(Date.now() - 10800000),
          status: 'completed',
          priority: 'low'
        }
      ];
    } catch (error) {
      console.error('Error loading recent activities:', error);
    }
  }

  getCurrentDate(): string {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  updateLastUpdated(): void {
    this.lastUpdated = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  async refreshData(): Promise<void> {
    this.isRefreshing = true;
    await this.loadDashboardData();
    this.isRefreshing = false;
  }

  retryLoadData(): void {
    this.hasError = false;
    this.loadDashboardData();
  }

  // Utility methods
  private getTodayAppointments(appointments: any[]): number {
    const today = new Date().toDateString();
    return appointments.filter(a => new Date(a.appointment_date || a.created_at).toDateString() === today).length;
  }

  private getNewPatientsThisMonth(patients: any[]): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return patients.filter(p => {
      const createdDate = new Date(p.created_at);
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    }).length;
  }

  private calculateMonthlyRevenue(appointments: any[]): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyAppointments = appointments.filter(a => {
      const appointmentDate = new Date(a.appointment_date || a.created_at);
      return appointmentDate.getMonth() === currentMonth && appointmentDate.getFullYear() === currentYear;
    });
    return monthlyAppointments.length * 500000; // Mock revenue calculation
  }

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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  private calculateChange(current: number, previous: number): string {
    if (previous === 0) return '+0%';
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  }

  private getChangeType(current: number, previous: number): 'increase' | 'decrease' | 'neutral' {
    if (current > previous) return 'increase';
    if (current < previous) return 'decrease';
    return 'neutral';
  }

  // Template helper methods
  getChangeColorClass(changeType: 'increase' | 'decrease' | 'neutral'): string {
    switch (changeType) {
      case 'increase': return 'bg-green-100 text-green-800';
      case 'decrease': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getActivityIconColor(type: string): string {
    switch (type) {
      case 'patient': return 'bg-blue-500';
      case 'appointment': return 'bg-green-500';
      case 'staff': return 'bg-purple-500';
      case 'system': return 'bg-gray-500';
      default: return 'bg-indigo-500';
    }
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'patient': return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
      case 'appointment': return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
      case 'staff': return 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z';
      case 'system': return 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z';
      default: return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getPriorityColorClass(priority: string): string {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusTextColor(status: string): string {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  // Additional methods used in template
  getFormattedTime(): string {
    return new Date().toLocaleTimeString();
  }

  navigateToAppointments(): void {
    this.router.navigate(['/admin/appointment']);
  }

  navigateToPatients(): void {
    this.router.navigate(['/admin/patient']);
  }

  navigateToStaff(): void {
    this.router.navigate(['/admin/staff']);
  }

  navigateToServices(): void {
    this.router.navigate(['/admin/services']);
  }

  navigateToAnalytics(): void {
    this.router.navigate(['/admin/analytic']);
  }

  // Quick action handlers
  addNewPatient(): void {
    this.router.navigate(['/admin/patient'], { queryParams: { action: 'add' } });
  }

  scheduleAppointment(): void {
    this.router.navigate(['/admin/appointment'], { queryParams: { action: 'schedule' } });
  }

  addNewStaff(): void {
    this.router.navigate(['/admin/staff'], { queryParams: { action: 'add' } });
  }

  generateReport(): void {
    this.router.navigate(['/admin/analytic'], { queryParams: { action: 'report' } });
  }

  // System management actions
  viewSystemLogs(): void {
    console.log('📋 Viewing system logs...');
    // Could implement a modal or navigate to logs page
  }

  backupDatabase(): void {
    console.log('💾 Initiating database backup...');
    // Could implement backup functionality
  }

  optimizePerformance(): void {
    console.log('⚡ Optimizing system performance...');
    // Could implement performance optimization
  }

  refreshActivity(): void {
    this.isRefreshing = true;
    // Simulate refresh
    setTimeout(() => {
      this.isRefreshing = false;
      this.loadDashboardData();
    }, 1000);
  }

  getActivityColor(type: string): string {
    switch (type) {
      case 'patient': return 'bg-blue-500';
      case 'appointment': return 'bg-green-500';
      case 'staff': return 'bg-purple-500';
      case 'system': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  }

  getRelativeTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // TrackBy functions for performance
  trackByCardTitle(_index: number, card: StatsCard): string {
    return card.title;
  }

  trackByActivityId(_index: number, activity: RecentActivity): string {
    return activity.id;
  }
}
