import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { StatsCardComponent } from '../stats-card/stats-card.component';
import { MainPanelsComponent } from '../main-panels/main-panels.component';
import { HeaderComponent } from "../header/header.component";
import { SidebarComponent } from "../sidebar/sidebar.component";
import { SupabaseService } from '../../supabase.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, StatsCardComponent, MainPanelsComponent, HeaderComponent, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  notifications: any[] = [];
  dashboardStats: any = {};
  recentActivities: any[] = [];
  isLoading = false;

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    this.isLoading = true;
    try {
      // Load dashboard statistics
      this.dashboardStats = await this.supabaseService.getAdminDashboardStats();

      // Load recent activities
      this.recentActivities = await this.supabaseService.getRecentActivities();

      console.log('Dashboard loaded successfully:', this.dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      this.isLoading = false;
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

  trackByNotificationId(index: number, notification: any) {
    return notification.notification_id ?? index;
  }
}
