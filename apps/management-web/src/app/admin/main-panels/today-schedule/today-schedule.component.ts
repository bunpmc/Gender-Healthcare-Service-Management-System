import { SupabaseService } from './../../../supabase.service';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

interface Schedule {
  time: string;
  description: string;
  status: string;
}

@Component({
  selector: 'app-today-schedule',
  imports: [CommonModule],
  templateUrl: './today-schedule.component.html',
  styleUrl: './today-schedule.component.css'
})
export class TodayScheduleComponent implements OnInit {
  schedules: Schedule[] = [];
  isLoading = true;

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    await this.loadTodaySchedules();
  }

  async loadTodaySchedules() {
    this.isLoading = true;
    try {
      const today = this.supabaseService.getTodayDate();
      const appointments = await this.supabaseService.getTodayAppointments(today);
      this.schedules = appointments.map(appointment => ({
        time: appointment.start_time,
        description: `Appointment with ${appointment.patient?.full_name || 'Unknown Patient'}`,
        status: appointment.status || 'pending'
      }));
    } catch (error) {
      console.error('Error loading today\'s appointments:', error);
      this.schedules = [];
    } finally {
      this.isLoading = false;
    }
  }
}
