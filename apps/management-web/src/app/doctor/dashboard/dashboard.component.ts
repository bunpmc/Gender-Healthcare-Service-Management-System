import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../supabase.service';
import { Router } from '@angular/router';

interface DashboardStats {
  todayAppointments: number;
  pendingAppointments: number;
  totalPatients: number;
  recentAppointments: any[];
}

@Component({
  selector: 'app-doctor-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = {
    todayAppointments: 0,
    pendingAppointments: 0,
    totalPatients: 0,
    recentAppointments: []
  };

  loading = true;
  error: string | null = null;
  doctorId: string | null = null;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.doctorId = localStorage.getItem('doctor_id') || localStorage.getItem('staff_id');
    if (!this.doctorId) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      this.loading = true;
      this.stats = await this.supabaseService.getDoctorDashboardStats(this.doctorId!);
    } catch (error: any) {
      this.error = error.message || 'Failed to load dashboard data';
      console.error('Dashboard error:', error);
    } finally {
      this.loading = false;
    }
  }

  navigateToAppointments() {
    this.router.navigate(['/doctor/dashboard/appointments']);
  }

  navigateToConsultantMeetings() {
    this.router.navigate(['/doctor/dashboard/consultant-meetings']);
  }

  navigateToPatients() {
    this.router.navigate(['/doctor/dashboard/patients']);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'in_progress': return 'text-purple-600 bg-purple-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
