import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

interface Task {
  task_id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  due_date?: string;
  assigned_to?: string;
  created_at: string;
}

interface CheckInPatient {
  patient_id: string;
  patient_name: string;
  appointment_time: string;
  doctor_name: string;
  phone_number: string;
  status: 'waiting' | 'checked_in' | 'with_doctor' | 'completed';
}

@Component({
  selector: 'app-reception-tasks',
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
                Reception Tasks
              </h1>
              <p class="mt-2 text-gray-600">Manage daily tasks and patient check-ins</p>
            </div>
            <div class="mt-4 md:mt-0 flex space-x-3">
              <button 
                (click)="activeTab = 'tasks'"
                [class]="activeTab === 'tasks' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300'"
                class="px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
                Daily Tasks
              </button>
              <button 
                (click)="activeTab = 'checkins'"
                [class]="activeTab === 'checkins' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300'"
                class="px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
                Patient Check-ins
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>

        <!-- Daily Tasks Tab -->
        <div *ngIf="!loading && activeTab === 'tasks'">
          <!-- Tasks Header -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">Daily Tasks</h2>
              <button 
                (click)="addNewTask()"
                class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium">
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Task
              </button>
            </div>
          </div>

          <!-- Tasks List -->
          <div class="space-y-4">
            <div *ngFor="let task of tasks" 
                 class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-2">
                    <h3 class="text-lg font-medium text-gray-900">{{ task.title }}</h3>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [ngClass]="getPriorityColor(task.priority)">
                      {{ task.priority | titlecase }} Priority
                    </span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [ngClass]="getTaskStatusColor(task.status)">
                      {{ task.status | titlecase }}
                    </span>
                  </div>
                  <p class="text-gray-600 mb-3">{{ task.description }}</p>
                  <div class="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Created: {{ formatDate(task.created_at) }}</span>
                    <span *ngIf="task.due_date">Due: {{ formatDate(task.due_date) }}</span>
                    <span *ngIf="task.assigned_to">Assigned to: {{ task.assigned_to }}</span>
                  </div>
                </div>
                <div class="flex space-x-2 ml-4">
                  <button 
                    (click)="updateTaskStatus(task)"
                    class="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  <button 
                    (click)="deleteTask(task)"
                    class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty Tasks State -->
          <div *ngIf="tasks.length === 0" class="bg-white rounded-xl shadow-lg p-8 text-center">
            <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Tasks</h3>
            <p class="text-gray-500">No daily tasks found. Add a new task to get started.</p>
          </div>
        </div>

        <!-- Patient Check-ins Tab -->
        <div *ngIf="!loading && activeTab === 'checkins'">
          <!-- Check-ins Header -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">Patient Check-ins</h2>
              <div class="flex space-x-3">
                <select 
                  [(ngModel)]="checkInFilter"
                  (change)="filterCheckIns()"
                  class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                  <option value="">All Patients</option>
                  <option value="waiting">Waiting</option>
                  <option value="checked_in">Checked In</option>
                  <option value="with_doctor">With Doctor</option>
                  <option value="completed">Completed</option>
                </select>
                <button 
                  (click)="refreshCheckIns()"
                  class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium">
                  <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <!-- Check-ins List -->
          <div class="space-y-4">
            <div *ngFor="let patient of filteredCheckIns" 
                 class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                  <div class="flex-shrink-0">
                    <div class="h-12 w-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 class="text-lg font-medium text-gray-900">{{ patient.patient_name }}</h3>
                    <p class="text-sm text-gray-600">{{ patient.phone_number }}</p>
                    <div class="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span>{{ patient.appointment_time }}</span>
                      <span>•</span>
                      <span>{{ patient.doctor_name }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center space-x-4">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                        [ngClass]="getCheckInStatusColor(patient.status)">
                    {{ patient.status | titlecase }}
                  </span>
                  <div class="flex space-x-2">
                    <button 
                      *ngIf="patient.status === 'waiting'"
                      (click)="checkInPatient(patient)"
                      class="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium">
                      Check In
                    </button>
                    <button 
                      *ngIf="patient.status === 'checked_in'"
                      (click)="sendToDoctor(patient)"
                      class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium">
                      Send to Doctor
                    </button>
                    <button 
                      (click)="viewPatientDetails(patient)"
                      class="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty Check-ins State -->
          <div *ngIf="filteredCheckIns.length === 0" class="bg-white rounded-xl shadow-lg p-8 text-center">
            <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Patients</h3>
            <p class="text-gray-500">No patients found for check-in.</p>
          </div>
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
export class ReceptionTasksComponent implements OnInit {
  loading = true;
  activeTab: 'tasks' | 'checkins' = 'tasks';
  checkInFilter = '';

  tasks: Task[] = [];
  checkIns: CheckInPatient[] = [];
  filteredCheckIns: CheckInPatient[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loadData();
    this.checkQueryParams();
  }

  checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'check-in') {
        this.activeTab = 'checkins';
      }
    });
  }

  async loadData(): Promise<void> {
    try {
      this.loading = true;
      
      // Simulate API call with demo data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.tasks = [
        {
          task_id: '1',
          title: 'Update patient records',
          description: 'Review and update patient information in the system',
          priority: 'high',
          status: 'pending',
          due_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        {
          task_id: '2',
          title: 'Confirm tomorrow appointments',
          description: 'Call patients to confirm their appointments for tomorrow',
          priority: 'medium',
          status: 'in_progress',
          created_at: new Date().toISOString()
        },
        {
          task_id: '3',
          title: 'Inventory check',
          description: 'Check medical supplies and update inventory',
          priority: 'low',
          status: 'completed',
          created_at: new Date().toISOString()
        }
      ];

      this.checkIns = [
        {
          patient_id: '1',
          patient_name: 'John Smith',
          appointment_time: '09:00 AM',
          doctor_name: 'Dr. Sarah Smith',
          phone_number: '+1 (555) 123-4567',
          status: 'waiting'
        },
        {
          patient_id: '2',
          patient_name: 'Jane Doe',
          appointment_time: '09:30 AM',
          doctor_name: 'Dr. Michael Johnson',
          phone_number: '+1 (555) 987-6543',
          status: 'checked_in'
        },
        {
          patient_id: '3',
          patient_name: 'Mike Wilson',
          appointment_time: '10:00 AM',
          doctor_name: 'Dr. Emily Davis',
          phone_number: '+1 (555) 456-7890',
          status: 'with_doctor'
        }
      ];

      this.filteredCheckIns = [...this.checkIns];
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      this.loading = false;
    }
  }

  filterCheckIns(): void {
    if (!this.checkInFilter) {
      this.filteredCheckIns = [...this.checkIns];
    } else {
      this.filteredCheckIns = this.checkIns.filter(patient => 
        patient.status === this.checkInFilter
      );
    }
  }

  refreshCheckIns(): void {
    this.loadData();
  }

  addNewTask(): void {
    console.log('➕ Adding new task');
    // TODO: Implement add task modal
  }

  updateTaskStatus(task: Task): void {
    console.log('✏️ Updating task status:', task.task_id);
    // TODO: Implement task status update
  }

  deleteTask(task: Task): void {
    console.log('🗑️ Deleting task:', task.task_id);
    // TODO: Implement task deletion
  }

  checkInPatient(patient: CheckInPatient): void {
    console.log('✅ Checking in patient:', patient.patient_name);
    patient.status = 'checked_in';
    this.filterCheckIns();
  }

  sendToDoctor(patient: CheckInPatient): void {
    console.log('👨‍⚕️ Sending patient to doctor:', patient.patient_name);
    patient.status = 'with_doctor';
    this.filterCheckIns();
  }

  viewPatientDetails(patient: CheckInPatient): void {
    console.log('👁️ Viewing patient details:', patient.patient_name);
    // TODO: Implement patient details modal
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTaskStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getCheckInStatusColor(status: string): string {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'checked_in':
        return 'bg-blue-100 text-blue-800';
      case 'with_doctor':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
