import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../supabase.service';

@Component({
  selector: 'app-css-charts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './css-charts.component.html',
  styleUrls: ['./css-charts.component.css']
})
export class CssChartsComponent implements OnInit {
  private supabaseService = inject(SupabaseService);

  // Component state
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';

  // Chart data
  patientGrowthData: any[] = [];
  revenueData: any[] = [];
  ageDistributionData: any[] = [];
  genderDistributionData: any[] = [];
  appointmentStatusData: any[] = [];

  // Max values for percentage calculations
  maxPatientGrowth: number = 100;
  maxRevenue: number = 4000000;
  maxAgeDistribution: number = 100;
  maxGenderDistribution: number = 100;
  maxAppointmentStatus: number = 100;

  // Total counts for percentage calculations
  totalAgeDistribution: number = 0;
  totalGenderDistribution: number = 0;

  // Healthcare color scheme
  healthcareColors = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#a855f7', // Purple
    '#c084fc', // Light purple
    '#d8b4fe', // Very light purple
    '#e9d5ff'  // Lightest purple
  ];

  ngOnInit() {
    this.loadAnalyticsData();
  }

  async loadAnalyticsData(): Promise<void> {
    try {
      this.isLoading = true;
      this.hasError = false;

      console.log('🔄 Loading analytics data from Supabase...');

      // Fetch real data from Supabase
      const [
        monthlyPatientGrowth,
        monthlyRevenue,
        ageDistribution,
        genderDistribution,
        appointmentStatusDistribution
      ] = await Promise.all([
        this.supabaseService.getMonthlyPatientGrowth(6),
        this.supabaseService.getMonthlyRevenue(6),
        this.supabaseService.getAgeDistribution(),
        this.supabaseService.getGenderDistribution(),
        this.supabaseService.getAppointmentStatusDistribution()
      ]);

      console.log('✅ Successfully fetched analytics data:', {
        patientGrowth: monthlyPatientGrowth,
        revenue: monthlyRevenue,
        ageDistribution,
        genderDistribution,
        appointmentStatus: appointmentStatusDistribution
      });

      // Process and format chart data
      this.formatChartData(
        monthlyPatientGrowth,
        monthlyRevenue,
        ageDistribution,
        genderDistribution,
        appointmentStatusDistribution
      );

      this.isLoading = false;

    } catch (error: any) {
      console.error('❌ Error loading analytics data:', error);
      this.hasError = true;
      this.errorMessage = error.message || 'Failed to load analytics data from database. Please try again.';
      this.isLoading = false;
    }
  }

  private formatChartData(
    monthlyPatientGrowth: any[],
    monthlyRevenue: any[],
    ageDistribution: any,
    genderDistribution: any,
    appointmentStatusDistribution: any[]
  ) {
    // Patient Growth Chart Data (real data from Supabase)
    if (monthlyPatientGrowth && monthlyPatientGrowth.length > 0) {
      this.patientGrowthData = monthlyPatientGrowth;
      this.maxPatientGrowth = Math.max(...this.patientGrowthData.map(item => item.value), 1);
    } else {
      // Fallback data if no real data available
      this.patientGrowthData = [
        { month: 'Jan', value: 0 },
        { month: 'Feb', value: 0 },
        { month: 'Mar', value: 0 },
        { month: 'Apr', value: 0 },
        { month: 'May', value: 0 },
        { month: 'Jun', value: 0 }
      ];
      this.maxPatientGrowth = 1;
    }

    // Revenue Chart Data (real data from Supabase)
    if (monthlyRevenue && monthlyRevenue.length > 0) {
      this.revenueData = monthlyRevenue;
      this.maxRevenue = Math.max(...this.revenueData.map(item => item.value), 1);
    } else {
      // Fallback data if no real data available
      this.revenueData = [
        { month: 'Jan', value: 0 },
        { month: 'Feb', value: 0 },
        { month: 'Mar', value: 0 },
        { month: 'Apr', value: 0 },
        { month: 'May', value: 0 },
        { month: 'Jun', value: 0 }
      ];
      this.maxRevenue = 1;
    }

    // Age Distribution Chart Data (real data from Supabase)
    if (ageDistribution && typeof ageDistribution === 'object') {
      const rawData = Object.entries(ageDistribution).map(([key, value]) => ({
        name: key,
        value: value as number
      }));

      // Calculate total for percentage conversion
      this.totalAgeDistribution = rawData.reduce((sum, item) => sum + item.value, 0);

      // Convert to percentages that sum to 100%
      if (this.totalAgeDistribution > 0) {
        this.ageDistributionData = this.calculatePercentages(rawData);
      } else {
        this.ageDistributionData = rawData;
      }

      this.maxAgeDistribution = Math.max(...this.ageDistributionData.map(item => item.value), 1);
    } else {
      // Fallback data if no real data available
      this.ageDistributionData = [
        { name: '0–18', value: 0 },
        { name: '19–35', value: 0 },
        { name: '36–50', value: 0 },
        { name: '51+', value: 0 }
      ];
      this.totalAgeDistribution = 0;
      this.maxAgeDistribution = 1;
    }

    // Gender Distribution Chart Data (real data from Supabase)
    if (genderDistribution && typeof genderDistribution === 'object') {
      const rawData = Object.entries(genderDistribution).map(([key, value]) => ({
        name: this.formatGenderName(key),
        value: value as number
      }));

      // Calculate total for percentage conversion
      this.totalGenderDistribution = rawData.reduce((sum, item) => sum + item.value, 0);

      // Convert to percentages that sum to 100%
      if (this.totalGenderDistribution > 0) {
        this.genderDistributionData = this.calculatePercentages(rawData);
      } else {
        this.genderDistributionData = rawData;
      }

      this.maxGenderDistribution = Math.max(...this.genderDistributionData.map(item => item.value), 1);
    } else {
      // Fallback data if no real data available
      this.genderDistributionData = [
        { name: 'Male', value: 0 },
        { name: 'Female', value: 0 },
        { name: 'Other', value: 0 }
      ];
      this.totalGenderDistribution = 0;
      this.maxGenderDistribution = 1;
    }

    // Appointment Status Data (real data from Supabase)
    if (appointmentStatusDistribution && appointmentStatusDistribution.length > 0) {
      this.appointmentStatusData = appointmentStatusDistribution;
      this.maxAppointmentStatus = Math.max(...this.appointmentStatusData.map(item => item.value), 1);
    } else {
      // Fallback data if no real data available
      this.appointmentStatusData = [
        { name: 'Pending', value: 0 },
        { name: 'Confirmed', value: 0 },
        { name: 'Completed', value: 0 },
        { name: 'Cancelled', value: 0 }
      ];
      this.maxAppointmentStatus = 1;
    }
  }

  formatCurrency(value: number): string {
    if (value === 0) return '0 VND';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  // Helper method to format gender names
  private formatGenderName(gender: string): string {
    const genderMap: { [key: string]: string } = {
      'male': 'Male',
      'female': 'Female',
      'other': 'Other',
      'prefer_not_to_say': 'Prefer not to say'
    };
    return genderMap[gender.toLowerCase()] || gender;
  }

  /**
   * Calculate percentages that sum to exactly 100%
   * Uses proper rounding and distributes remainder to maintain 100% total
   */
  private calculatePercentages(data: { name: string; value: number }[]): { name: string; value: number }[] {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
      return data.map(item => ({ ...item, value: 0 }));
    }

    // Calculate raw percentages
    const rawPercentages = data.map(item => ({
      ...item,
      rawPercentage: (item.value / total) * 100
    }));

    // Round down to get integer parts
    const roundedData = rawPercentages.map(item => ({
      ...item,
      value: Math.floor(item.rawPercentage),
      remainder: item.rawPercentage - Math.floor(item.rawPercentage)
    }));

    // Calculate how much we need to add to reach 100%
    const currentSum = roundedData.reduce((sum, item) => sum + item.value, 0);
    const remainderToDistribute = 100 - currentSum;

    // Sort by remainder (descending) to distribute the remaining percentage points
    const sortedByRemainder = [...roundedData].sort((a, b) => b.remainder - a.remainder);

    // Add 1 to the items with the largest remainders
    for (let i = 0; i < remainderToDistribute && i < sortedByRemainder.length; i++) {
      sortedByRemainder[i].value += 1;
    }

    // Return in original order
    return data.map(originalItem => {
      const matchingItem = sortedByRemainder.find(item => item.name === originalItem.name);
      return {
        name: originalItem.name,
        value: matchingItem?.value || 0
      };
    });
  }

  retryLoadData(): void {
    this.hasError = false;
    this.loadAnalyticsData();
  }
}
