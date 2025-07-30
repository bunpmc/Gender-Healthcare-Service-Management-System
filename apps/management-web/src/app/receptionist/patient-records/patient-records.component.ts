import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  emergency_contact: string;
  medical_history: string;
  created_at: string;
  last_visit?: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-patient-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Patient Records</h1>
            <p class="text-gray-600">View and manage patient files and medical records</p>
          </div>
          <div class="flex items-center space-x-3">
            <div class="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
              <p class="text-sm font-medium text-indigo-700">{{ patients.length }} Total Patients</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Search Bar -->
          <div class="flex-1">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (input)="filterPatients()"
                placeholder="Search patients by name, email, or phone..."
                class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>
          </div>

          <!-- Status Filter -->
          <div class="md:w-48">
            <select
              [(ngModel)]="statusFilter"
              (change)="filterPatients()"
              class="block w-full px-3 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">All Patients</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center h-64">
        <div class="relative">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
        <div class="flex items-center">
          <svg class="h-6 w-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 class="text-lg font-medium text-red-800">Error Loading Patient Records</h3>
            <p class="text-red-600">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Patient Records Grid -->
      <div *ngIf="!loading && !error">
        <div *ngIf="filteredPatients.length === 0" class="text-center py-12">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <p class="text-gray-500 font-medium">No patient records found.</p>
          <p class="text-sm text-gray-400 mt-1">Try adjusting your search criteria.</p>
        </div>

        <div *ngIf="filteredPatients.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            *ngFor="let patient of filteredPatients"
            class="bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
            (click)="viewPatientDetails(patient)">
            
            <!-- Patient Card Header -->
            <div class="p-6 border-b border-gray-100">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-gray-900">{{ patient.full_name }}</h3>
                  <p class="text-sm text-gray-500">ID: {{ patient.id }}</p>
                </div>
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  [ngClass]="patient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                  {{ patient.status | titlecase }}
                </span>
              </div>
            </div>

            <!-- Patient Card Content -->
            <div class="p-6">
              <div class="space-y-3">
                <div class="flex items-center text-sm">
                  <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <span class="text-gray-600">{{ patient.email }}</span>
                </div>
                <div class="flex items-center text-sm">
                  <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  <span class="text-gray-600">{{ patient.phone }}</span>
                </div>
                <div class="flex items-center text-sm">
                  <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span class="text-gray-600">DOB: {{ formatDate(patient.date_of_birth) }}</span>
                </div>
                <div *ngIf="patient.last_visit" class="flex items-center text-sm">
                  <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span class="text-gray-600">Last Visit: {{ formatDate(patient.last_visit) }}</span>
                </div>
              </div>
            </div>

            <!-- Patient Card Footer -->
            <div class="px-6 py-4 bg-gray-50 rounded-b-2xl">
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">
                  Registered: {{ formatDate(patient.created_at) }}
                </span>
                <div class="flex items-center text-indigo-600 text-sm font-medium">
                  <span>View Details</span>
                  <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Modern Patient Records Styles */
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Card hover effects */
    .hover\\:shadow-2xl:hover {
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    /* Hover scale effect */
    .hover\\:scale-105:hover {
      transform: scale(1.05);
    }
  `]
})
export class PatientRecordsComponent implements OnInit {
  loading = true;
  error: string | null = null;
  searchTerm = '';
  statusFilter = '';

  patients: Patient[] = [];
  filteredPatients: Patient[] = [];

  constructor() {}

  ngOnInit(): void {
    this.loadPatientRecords();
  }

  loadPatientRecords(): void {
    this.loading = true;
    this.error = null;

    // Simulate API call with mock data
    setTimeout(() => {
      try {
        this.patients = this.getMockPatients();
        this.filteredPatients = [...this.patients];
        this.loading = false;
      } catch (err) {
        this.error = 'Failed to load patient records. Please try again.';
        this.loading = false;
      }
    }, 1000);
  }

  filterPatients(): void {
    this.filteredPatients = this.patients.filter(patient => {
      const matchesSearch = !this.searchTerm || 
        patient.full_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        patient.phone.includes(this.searchTerm);
      
      const matchesStatus = !this.statusFilter || patient.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  viewPatientDetails(patient: Patient): void {
    console.log('👤 Viewing patient details:', patient);
    // TODO: Navigate to patient detail view or open modal
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  private getMockPatients(): Patient[] {
    return [
      {
        id: 'PAT001',
        full_name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1 (555) 123-4567',
        date_of_birth: '1985-03-15',
        gender: 'Female',
        address: '123 Main St, City, State 12345',
        emergency_contact: 'John Johnson - +1 (555) 987-6543',
        medical_history: 'No significant medical history',
        created_at: '2024-01-15T10:30:00Z',
        last_visit: '2024-12-01T14:30:00Z',
        status: 'active'
      },
      {
        id: 'PAT002',
        full_name: 'Michael Chen',
        email: 'michael.chen@email.com',
        phone: '+1 (555) 234-5678',
        date_of_birth: '1990-07-22',
        gender: 'Male',
        address: '456 Oak Ave, City, State 12345',
        emergency_contact: 'Lisa Chen - +1 (555) 876-5432',
        medical_history: 'Allergic to penicillin',
        created_at: '2024-02-20T09:15:00Z',
        last_visit: '2024-11-28T11:00:00Z',
        status: 'active'
      },
      {
        id: 'PAT003',
        full_name: 'Emily Rodriguez',
        email: 'emily.rodriguez@email.com',
        phone: '+1 (555) 345-6789',
        date_of_birth: '1988-11-08',
        gender: 'Female',
        address: '789 Pine St, City, State 12345',
        emergency_contact: 'Carlos Rodriguez - +1 (555) 765-4321',
        medical_history: 'Diabetes Type 2',
        created_at: '2024-03-10T16:45:00Z',
        status: 'inactive'
      }
    ];
  }
}
