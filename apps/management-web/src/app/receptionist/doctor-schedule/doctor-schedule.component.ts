import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DoctorSchedule {
  doctor_id: string;
  doctor_name: string;
  speciality: string;
  department: string;
  status: 'available' | 'busy' | 'off_duty';
  current_appointment?: string;
  next_available?: string;
  today_appointments: number;
  schedule: TimeSlot[];
}

interface TimeSlot {
  time: string;
  status: 'available' | 'booked' | 'break';
  patient_name?: string;
  appointment_type?: string;
}

@Component({
  selector: 'app-doctor-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <!-- Header Background -->
      <div class="bg-gradient-to-r from-indigo-600 via-purple-700 to-pink-800 h-32 relative overflow-hidden">
        <div class="absolute inset-0 bg-black opacity-10"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent"></div>
      </div>

      <div class="relative -mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <!-- Page Header -->
        <div class="bg-white rounded-xl shadow-xl p-6 mb-8">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Doctor Schedule
              </h1>
              <p class="mt-2 text-gray-600">View doctor availability and manage schedules</p>
            </div>
            <div class="mt-4 md:mt-0 flex space-x-3">
              <select 
                [(ngModel)]="selectedDate"
                (change)="loadSchedules()"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="week">This Week</option>
              </select>
              <button 
                (click)="refreshSchedules()"
                class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium">
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>

        <!-- Doctor Cards -->
        <div *ngIf="!loading" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div *ngFor="let doctor of doctorSchedules" 
               class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            
            <!-- Doctor Header -->
            <div class="p-6 border-b border-gray-200">
              <div class="flex items-center space-x-4">
                <div class="flex-shrink-0">
                  <div class="h-16 w-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900">{{ doctor.doctor_name }}</h3>
                  <p class="text-sm text-gray-600">{{ doctor.speciality | titlecase }}</p>
                  <p class="text-xs text-gray-500">{{ doctor.department | titlecase }}</p>
                </div>
                <div class="flex-shrink-0">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="getStatusColor(doctor.status)">
                    {{ doctor.status | titlecase }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Doctor Stats -->
            <div class="p-6 border-b border-gray-200">
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center">
                  <p class="text-2xl font-bold text-indigo-600">{{ doctor.today_appointments }}</p>
                  <p class="text-xs text-gray-500">Today's Appointments</p>
                </div>
                <div class="text-center">
                  <p class="text-sm font-medium text-gray-900">{{ doctor.next_available || 'N/A' }}</p>
                  <p class="text-xs text-gray-500">Next Available</p>
                </div>
              </div>
              
              <div *ngIf="doctor.current_appointment" class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p class="text-sm font-medium text-yellow-800">Currently with:</p>
                <p class="text-sm text-yellow-700">{{ doctor.current_appointment }}</p>
              </div>
            </div>

            <!-- Schedule Slots -->
            <div class="p-6">
              <h4 class="text-sm font-medium text-gray-900 mb-4">Today's Schedule</h4>
              <div class="space-y-2 max-h-64 overflow-y-auto">
                <div *ngFor="let slot of doctor.schedule" 
                     class="flex items-center justify-between p-2 rounded-lg"
                     [ngClass]="getSlotColor(slot.status)">
                  <div class="flex items-center space-x-3">
                    <span class="text-sm font-medium">{{ slot.time }}</span>
                    <span class="text-xs px-2 py-1 rounded-full"
                          [ngClass]="getSlotStatusColor(slot.status)">
                      {{ slot.status | titlecase }}
                    </span>
                  </div>
                  <div *ngIf="slot.patient_name" class="text-right">
                    <p class="text-sm font-medium text-gray-900">{{ slot.patient_name }}</p>
                    <p class="text-xs text-gray-500">{{ slot.appointment_type }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div class="flex space-x-2">
                <button 
                  (click)="viewDoctorDetails(doctor)"
                  class="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  View Details
                </button>
                <button 
                  (click)="scheduleAppointment(doctor)"
                  class="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && doctorSchedules.length === 0" class="bg-white rounded-xl shadow-lg p-8 text-center">
          <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No Doctor Schedules</h3>
          <p class="text-gray-500">No doctor schedules found for the selected date.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class DoctorScheduleComponent implements OnInit {
  loading = true;
  selectedDate = '';
  doctorSchedules: DoctorSchedule[] = [];

  constructor() {}

  ngOnInit(): void {
    this.loadSchedules();
  }

  async loadSchedules(): Promise<void> {
    try {
      this.loading = true;
      
      // Simulate API call with demo data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.doctorSchedules = [
        {
          doctor_id: '1',
          doctor_name: 'Dr. Sarah Smith',
          speciality: 'reproductive_specialist',
          department: 'reproductive_health',
          status: 'available',
          next_available: '2:00 PM',
          today_appointments: 8,
          schedule: [
            { time: '09:00', status: 'booked', patient_name: 'John Doe', appointment_type: 'Consultation' },
            { time: '09:30', status: 'booked', patient_name: 'Jane Smith', appointment_type: 'Follow-up' },
            { time: '10:00', status: 'break' },
            { time: '10:30', status: 'available' },
            { time: '11:00', status: 'available' },
            { time: '11:30', status: 'booked', patient_name: 'Mike Johnson', appointment_type: 'Consultation' },
            { time: '14:00', status: 'available' },
            { time: '14:30', status: 'available' },
            { time: '15:00', status: 'booked', patient_name: 'Sarah Wilson', appointment_type: 'Check-up' }
          ]
        },
        {
          doctor_id: '2',
          doctor_name: 'Dr. Michael Johnson',
          speciality: 'urologist',
          department: 'urology',
          status: 'busy',
          current_appointment: 'Robert Brown - Consultation',
          next_available: '3:30 PM',
          today_appointments: 6,
          schedule: [
            { time: '09:00', status: 'booked', patient_name: 'Robert Brown', appointment_type: 'Consultation' },
            { time: '09:45', status: 'booked', patient_name: 'Lisa Davis', appointment_type: 'Follow-up' },
            { time: '10:30', status: 'break' },
            { time: '11:00', status: 'booked', patient_name: 'Tom Wilson', appointment_type: 'Check-up' },
            { time: '15:30', status: 'available' },
            { time: '16:00', status: 'available' }
          ]
        },
        {
          doctor_id: '3',
          doctor_name: 'Dr. Emily Davis',
          speciality: 'gynecologist',
          department: 'gynecology',
          status: 'available',
          next_available: '1:00 PM',
          today_appointments: 5,
          schedule: [
            { time: '08:30', status: 'booked', patient_name: 'Anna Taylor', appointment_type: 'Consultation' },
            { time: '09:15', status: 'booked', patient_name: 'Maria Garcia', appointment_type: 'Check-up' },
            { time: '10:00', status: 'break' },
            { time: '13:00', status: 'available' },
            { time: '13:30', status: 'available' },
            { time: '14:00', status: 'booked', patient_name: 'Jennifer Lee', appointment_type: 'Follow-up' }
          ]
        }
      ];
      
    } catch (error) {
      console.error('❌ Error loading doctor schedules:', error);
    } finally {
      this.loading = false;
    }
  }

  refreshSchedules(): void {
    this.loadSchedules();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'off_duty':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getSlotColor(status: string): string {
    switch (status) {
      case 'available':
        return 'bg-green-50 border border-green-200';
      case 'booked':
        return 'bg-blue-50 border border-blue-200';
      case 'break':
        return 'bg-gray-50 border border-gray-200';
      default:
        return 'bg-gray-50 border border-gray-200';
    }
  }

  getSlotStatusColor(status: string): string {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'booked':
        return 'bg-blue-100 text-blue-800';
      case 'break':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  viewDoctorDetails(doctor: DoctorSchedule): void {
    console.log('👨‍⚕️ Viewing doctor details:', doctor.doctor_name);
    // TODO: Implement doctor details modal or navigation
  }

  scheduleAppointment(doctor: DoctorSchedule): void {
    console.log('📅 Scheduling appointment with:', doctor.doctor_name);
    // TODO: Implement appointment scheduling modal
  }
}
