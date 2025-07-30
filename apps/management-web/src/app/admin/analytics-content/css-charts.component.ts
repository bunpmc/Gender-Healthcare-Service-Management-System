import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../supabase.service';

@Component({
  selector: 'app-css-charts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex flex-col items-center justify-center py-12 space-y-4">
        <div class="relative">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
        <div class="text-center">
          <h3 class="text-lg font-semibold text-gray-900">Loading Analytics Data</h3>
          <p class="text-gray-600">Fetching real-time data from database...</p>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="hasError && !isLoading" class="bg-red-50 border border-red-200 rounded-xl p-6">
        <div class="flex items-center space-x-3">
          <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 class="text-lg font-semibold text-red-800">Error Loading Analytics</h3>
            <p class="text-red-600">{{ errorMessage }}</p>
          </div>
        </div>
        <button
          (click)="retryLoadData()"
          class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          Retry
        </button>
      </div>

      <!-- Charts Grid -->
      <div *ngIf="!isLoading && !hasError" class="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <!-- Patient Growth Chart -->
        <div class="bg-white rounded-2xl p-6 shadow-xl border border-white/20">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900">Patient Growth Trends</h2>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
              <span class="text-sm text-gray-600">Monthly Growth</span>
            </div>
          </div>
          <div class="space-y-4">
            <div *ngFor="let item of patientGrowthData; let i = index" class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">{{ item.month }}</span>
              <div class="flex items-center space-x-3 flex-1 ml-4">
                <div class="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    class="h-3 rounded-full transition-all duration-1000 ease-out"
                    [style.width]="(item.value / maxPatientGrowth * 100) + '%'"
                    [style.background]="'linear-gradient(90deg, ' + healthcareColors[i % healthcareColors.length] + ', ' + healthcareColors[(i + 1) % healthcareColors.length] + ')'">
                  </div>
                </div>
                <span class="text-sm font-bold text-gray-900 min-w-[3rem]">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Revenue Analytics Chart -->
        <div class="bg-white rounded-2xl p-6 shadow-xl border border-white/20">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900">Revenue Analytics</h2>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
              <span class="text-sm text-gray-600">Monthly Revenue</span>
            </div>
          </div>
          <div class="space-y-4">
            <div *ngFor="let item of revenueData; let i = index" class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">{{ item.month }}</span>
              <div class="flex items-center space-x-3 flex-1 ml-4">
                <div class="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    class="h-4 rounded-full transition-all duration-1000 ease-out"
                    [style.width]="(item.value / maxRevenue * 100) + '%'"
                    [style.background]="'linear-gradient(90deg, #10b981, #059669)'">
                  </div>
                </div>
                <span class="text-sm font-bold text-gray-900 min-w-[4rem]">{{ formatCurrency(item.value) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Age Distribution Chart -->
        <div class="bg-white rounded-2xl p-6 shadow-xl border border-white/20">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900">Age Distribution</h2>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
              <span class="text-sm text-gray-600">Patient Demographics</span>
            </div>
          </div>
          <div class="space-y-4">
            <div *ngFor="let item of ageDistributionData; let i = index" class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">{{ item.name }}</span>
              <div class="flex items-center space-x-3 flex-1 ml-4">
                <div class="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    class="h-3 rounded-full transition-all duration-1000 ease-out"
                    [style.width]="(item.value / maxAgeDistribution * 100) + '%'"
                    [style.background]="healthcareColors[i % healthcareColors.length]">
                  </div>
                </div>
                <span class="text-sm font-bold text-gray-900 min-w-[3rem]">{{ item.value }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Gender Distribution Chart -->
        <div class="bg-white rounded-2xl p-6 shadow-xl border border-white/20">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900">Gender Distribution</h2>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full"></div>
              <span class="text-sm text-gray-600">Patient Demographics</span>
            </div>
          </div>
          <div class="space-y-4">
            <div *ngFor="let item of genderDistributionData; let i = index" class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">{{ item.name }}</span>
              <div class="flex items-center space-x-3 flex-1 ml-4">
                <div class="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    class="h-3 rounded-full transition-all duration-1000 ease-out"
                    [style.width]="(item.value / maxGenderDistribution * 100) + '%'"
                    [style.background]="healthcareColors[i % healthcareColors.length]">
                  </div>
                </div>
                <span class="text-sm font-bold text-gray-900 min-w-[3rem]">{{ item.value }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Appointment Status Chart -->
        <div class="bg-white rounded-2xl p-6 shadow-xl border border-white/20 lg:col-span-2">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900">Appointment Status Overview</h2>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full"></div>
              <span class="text-sm text-gray-600">Current Status</span>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div *ngFor="let item of appointmentStatusData; let i = index"
                 class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-medium text-gray-700">{{ item.name }}</span>
                <div class="w-3 h-3 rounded-full" [style.background]="healthcareColors[i % healthcareColors.length]"></div>
              </div>
              <div class="text-2xl font-bold text-gray-900 mb-2">{{ item.value }}</div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all duration-1000 ease-out"
                  [style.width]="(item.value / maxAppointmentStatus * 100) + '%'"
                  [style.background]="healthcareColors[i % healthcareColors.length]">
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
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
