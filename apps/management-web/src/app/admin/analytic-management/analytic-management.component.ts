import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent } from './chart/chart.component';
import { KpiCardComponent } from './kpi-card/kpi-card.component';
import { HeaderComponent } from "../header/header.component";
import { SidebarComponent } from "../sidebar/sidebar.component";
import { SupabaseService } from '../../supabase.service';

@Component({
  selector: 'app-analytic-management',
  standalone: true,
  templateUrl: './analytic-management.component.html',
  styleUrl: './analytic-management.component.css',
  imports: [CommonModule, ChartComponent, KpiCardComponent, HeaderComponent, SidebarComponent]
})
export class AnalyticManagementComponent implements OnInit {
  isLoading = false;
  ageDistribution: { [key: string]: number } = {};
  genderDistribution: { [key: string]: number } = {};
  cancelledRate = 0;
  avgAppointmentDuration = 0;
  staffWorkloadBalance: any[] = [];
  taskCompletionRatio = 0;
  totalPatients = 0;
  totalAppointments = 0;
  pendingAppointments = 0;

  constructor(
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit() {
    this.isLoading = true;
    try {
      await this.loadAnalyticsData();
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadAnalyticsData() {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date();

    // Use SupabaseService methods that actually exist
    const patients = await this.supabaseService.getPatients(1, 1000);
    const today = new Date().toISOString().split('T')[0];
    const appointments = await this.supabaseService.getTodayAppointments(today);

    // Set basic analytics data
    this.totalPatients = patients.patients?.length || 0;
    this.totalAppointments = appointments?.length || 0;
    this.pendingAppointments = appointments?.filter((a: any) => a.appointment_status === 'pending')?.length || 0;

    // Set default values for analytics that don't have real implementations yet
    this.ageDistribution = {};
    this.genderDistribution = {};
    this.cancelledRate = 0;
    this.avgAppointmentDuration = 0;
    this.staffWorkloadBalance = [];
    this.taskCompletionRatio = 0;
  }
}

