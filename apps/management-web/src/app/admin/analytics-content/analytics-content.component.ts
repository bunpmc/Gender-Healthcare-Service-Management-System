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
  templateUrl: './analytics-content.component.html',
  styleUrls: ['./analytics-content.component.css']
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
  currentDate: Date = new Date();

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

  // Helper methods for KPI cards
  getProgressColor(changeType: 'increase' | 'decrease' | 'neutral'): string {
    switch (changeType) {
      case 'increase':
        return 'bg-gradient-to-r from-green-400 to-emerald-500';
      case 'decrease':
        return 'bg-gradient-to-r from-red-400 to-red-500';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  }

  getProgressWidth(changeType: 'increase' | 'decrease' | 'neutral'): number {
    switch (changeType) {
      case 'increase':
        return 85;
      case 'decrease':
        return 45;
      default:
        return 65;
    }
  }

  // Color helpers for demographics
  getItemColor(index: number): string {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ];
    return colors[index % colors.length];
  }

  getGenderColor(gender: string): string {
    const colorMap: { [key: string]: string } = {
      'Male': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'Female': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'Other': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'Prefer not to say': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'Non-binary': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    };
    return colorMap[gender] || 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
  }

  // Helper method for calculating total patients
  getTotalPatients(): number {
    if (!this.analyticsData?.patientStats) return 0;

    // Calculate from age distribution
    const ageTotal = this.getAgeDistributionArray().reduce((sum, item) => sum + item.count, 0);

    // Calculate from gender distribution  
    const genderTotal = this.getGenderDistributionArray().reduce((sum, item) => sum + item.count, 0);

    // Use the larger of the two, or fallback to totalPatients
    return Math.max(ageTotal, genderTotal, this.analyticsData.patientStats.totalPatients);
  }

  // Cleanup
  ngOnDestroy(): void {
    // No cleanup needed for ngx-charts
  }
}
