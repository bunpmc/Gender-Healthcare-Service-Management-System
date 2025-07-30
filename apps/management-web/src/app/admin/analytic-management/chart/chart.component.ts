import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../supabase.service';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css',
})
export class ChartComponent implements OnInit {
  ageDist: any;
  genderDist: any;
  cancelRate = 0;
  avgDuration = 0;
  staffStats: any;
  loading = true;
  error: string | null = null;

  // Chart data for ngx-charts
  ageDistChartData: any[] = [];
  genderDistChartData: any[] = [];

  // Chart options - responsive sizing
  view: [number, number] = [400, 300];
  showLegend = true;
  showLabels = true;
  isDoughnut = false;
  gradient = true;
  animations = true;

  // Color scheme with healthcare purple/indigo theme
  colorScheme: any = {
    domain: ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff']
  };

  maxAvgDuration = 120; // max duration for progress bar display

  constructor(private supabaseService: SupabaseService) {
    this.updateChartSize();
  }

  private updateChartSize() {
    // Responsive chart sizing based on screen width
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) {
        this.view = [300, 200]; // Mobile
      } else if (width < 1024) {
        this.view = [350, 250]; // Tablet
      } else {
        this.view = [400, 300]; // Desktop
      }
    }
  }

  async ngOnInit() {
    try {
      this.loading = true;
      this.error = null;

      // Fetch data from Supabase
      this.ageDist = await this.supabaseService.getAgeDistribution();
      this.genderDist = await this.supabaseService.getGenderDistribution();

      const start = new Date();
      start.setDate(start.getDate() - 30);
      const end = new Date();

      const startISO = start.toISOString();
      const endISO = end.toISOString();

      this.cancelRate = await this.supabaseService.getCancelledRate(startISO, endISO);
      this.avgDuration = await this.supabaseService.getAvgAppointmentDuration();
      this.staffStats = await this.supabaseService.getStaffWorkloadBalance();

      // Format data for ngx-charts
      this.formatChartData();

    } catch (error: any) {
      console.error('Error loading chart data:', error);
      this.error = error.message || 'Failed to load chart data';
    } finally {
      this.loading = false;
    }
  }

  private formatChartData() {
    // Format age distribution data
    if (this.ageDist && typeof this.ageDist === 'object') {
      const rawData = Object.entries(this.ageDist).map(([key, value]) => ({
        name: key,
        value: value as number
      }));

      // Convert to percentages that sum to 100%
      this.ageDistChartData = this.calculatePercentages(rawData);
    } else if (this.ageDist && Array.isArray(this.ageDist)) {
      const rawData = this.ageDist.map((item: any) => ({
        name: item.ageGroup || item.age_group || 'Unknown',
        value: item.count || 0
      }));

      // Convert to percentages that sum to 100%
      this.ageDistChartData = this.calculatePercentages(rawData);
    } else {
      // Fallback demo data (already in percentages)
      this.ageDistChartData = [
        { name: '0-18', value: 40 },
        { name: '19-35', value: 30 },
        { name: '36-60', value: 20 },
        { name: '60+', value: 10 }
      ];
    }

    // Format gender distribution data
    if (this.genderDist && typeof this.genderDist === 'object') {
      const rawData = Object.entries(this.genderDist).map(([key, value]) => ({
        name: this.formatGenderName(key),
        value: value as number
      }));

      // Convert to percentages that sum to 100%
      this.genderDistChartData = this.calculatePercentages(rawData);
    } else if (this.genderDist && Array.isArray(this.genderDist)) {
      const rawData = this.genderDist.map((item: any) => ({
        name: item.gender || 'Unknown',
        value: item.count || 0
      }));

      // Convert to percentages that sum to 100%
      this.genderDistChartData = this.calculatePercentages(rawData);
    } else {
      // Fallback demo data (already in percentages)
      this.genderDistChartData = [
        { name: 'Male', value: 55 },
        { name: 'Female', value: 45 }
      ];
    }
  }

  // Method to refresh chart data
  async refreshData() {
    await this.ngOnInit();
  }

  // Method to handle chart resize
  onResize() {
    this.updateChartSize();
  }

  // Method to get maximum value from chart data
  getMaxValue(data: any[]): number {
    if (!data || data.length === 0) return 100;
    return Math.max(...data.map(item => item.value || 0));
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
}
