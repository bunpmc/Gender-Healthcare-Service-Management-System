
import { SupabaseService } from '../../supabase.service';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

interface StatsCard {
  title: string;
  iconPath: string;
  value: string;
  subtext: string;
  alert?: string;
  loading?: boolean;
  priority?: 'normal' | 'high' | 'urgent';
}

@Component({
  selector: 'app-stats-card',
  imports: [CommonModule],
  templateUrl: './stats-card.component.html',
  styleUrl: './stats-card.component.css'
})

export class StatsCardComponent implements OnInit {
  statsCards: StatsCard[] = [
    {
      title: "Today's Appointments",
      iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      value: '-',
      subtext: 'Loading...',
      loading: true,
      priority: 'normal'
    },
    {
      title: 'Total Patients',
      iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      value: '-',
      subtext: 'Loading...',
      loading: true,
      priority: 'normal'
    },
    {
      title: 'Revenue Today',
      iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      value: '-',
      subtext: 'Loading...',
      loading: true,
      priority: 'normal'
    },
    {
      title: 'Pending Tasks',
      iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      value: '-',
      subtext: 'Loading...',
      loading: true,
      priority: 'normal'
    }
  ];

  lastUpdated: string = new Date().toLocaleTimeString('vi-VN');
  isLoading: boolean = false;
  hasCriticalAlertsAndNotLoading: boolean = false;

  constructor(private SupabaseService: SupabaseService) { }

  ngOnInit(): void {
    this.updateLastUpdated();
    this.loadStatsData();
  }

  private async loadStatsData(): Promise<void> {
    this.isLoading = true;
    try {
      // Load dashboard stats using fake data
      const dashboardStats = await this.SupabaseService.getAdminDashboardStats();

      const data = {
        todayAppointments: dashboardStats.todayAppointments,
        yesterdayAppointments: Math.max(0, dashboardStats.todayAppointments - 1), // Mock yesterday data
        totalPatients: dashboardStats.totalPatients,
        todayRevenue: dashboardStats.todayAppointments * 500000, // Mock revenue calculation
        yesterdayRevenue: (dashboardStats.todayAppointments - 1) * 500000,
        pendingTasks: dashboardStats.pendingAppointments,
        todayPendingTasks: Math.floor(dashboardStats.pendingAppointments / 2)
      };

      this.updateStatsCards(data);
      this.isLoading = false;
      this.hasCriticalAlertsAndNotLoading = this.hasCriticalAlerts;
      this.updateLastUpdated();
    } catch (error) {
      console.error('Error loading stats data:', error);
      this.handleError();
      this.isLoading = false;
      this.hasCriticalAlertsAndNotLoading = this.hasCriticalAlerts;
      this.updateLastUpdated();
    }
  }

  private updateStatsCards(data: any): void {
    // Update Today's Appointments
    const appointmentChange = this.calculatePercentageChange(
      data.todayAppointments,
      data.yesterdayAppointments
    );

    this.statsCards[0] = {
      ...this.statsCards[0],
      value: data.todayAppointments.toString(),
      subtext: `${appointmentChange >= 0 ? '+' : ''}${appointmentChange}% from yesterday`,
      loading: false,
      priority: data.todayAppointments > 10 ? 'high' : 'normal'
    };

    // Update Total Patients (for current month)
    this.statsCards[1] = {
      ...this.statsCards[1],
      value: this.formatNumber(data.totalPatients),
      subtext: 'Registered this month',
      loading: false,
      priority: 'normal'
    };

    // Update Revenue Today
    const revenueChange = this.calculatePercentageChange(
      data.todayRevenue,
      data.yesterdayRevenue
    );
    this.statsCards[2] = {
      ...this.statsCards[2],
      value: this.formatCurrency(data.todayRevenue),
      subtext: `${revenueChange >= 0 ? '+' : ''}${revenueChange}% from yesterday`,
      loading: false,
      priority: data.todayRevenue < data.yesterdayRevenue ? 'high' : 'normal'
    };

    // Update Pending Tasks
    const urgentThreshold = 5;
    const highThreshold = 3;
    let priority: 'normal' | 'high' | 'urgent' = 'normal';
    let alert: string | undefined;

    if (data.pendingTasks >= urgentThreshold) {
      priority = 'urgent';
      alert = `${data.pendingTasks} pending appointments need attention!`;
    } else if (data.pendingTasks >= highThreshold) {
      priority = 'high';
    }

    this.statsCards[3] = {
      ...this.statsCards[3],
      value: data.pendingTasks.toString(),
      subtext: data.todayPendingTasks > 0
        ? `${data.todayPendingTasks} due today`
        : 'All caught up for today',
      loading: false,
      priority: priority,
      alert: alert
    };
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private formatNumber(num: number): string {
    return num.toLocaleString();
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  private handleError(): void {
    this.statsCards.forEach((card, index) => {
      this.statsCards[index] = {
        ...card,
        value: 'Error',
        subtext: 'Failed to load data',
        loading: false,
        priority: 'normal'
      };
    });
  }

  private updateLastUpdated(): void {
    this.lastUpdated = new Date().toLocaleTimeString('vi-VN');
  }

  // Method to refresh data
  refreshData(): void {
    this.statsCards.forEach((card, index) => {
      card.loading = true;
      card.value = '-';
      card.subtext = 'Loading...';
      card.alert = undefined;
      card.priority = 'normal';
    });
    this.isLoading = true;
    this.loadStatsData();
  }

  // Getter to check if there are important pending tasks
  get hasUrgentTasks(): boolean {
    return this.statsCards[3]?.priority === 'urgent';
  }

  get hasCriticalAlerts(): boolean {
    return this.statsCards.some(card => card.alert !== undefined);
  }
}
