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
  allergies?: string[];
  chronic_conditions?: string[];
  medications?: string[];
  vaccination_status?: string;
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

    <!-- Patient Details Modal -->
    <div *ngIf="showPatientModal && selectedPatient" 
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
         (click)="closePatientModal()">
      <div class="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden"
           (click)="$event.stopPropagation()">
        
        <!-- Modal Header -->
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div>
                <h2 class="text-2xl font-bold">{{ selectedPatient.full_name }}</h2>
                <p class="text-indigo-200">Patient ID: {{ selectedPatient.id }}</p>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2"
                      [ngClass]="selectedPatient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                  {{ selectedPatient.status | titlecase }}
                </span>
              </div>
            </div>
            <button (click)="closePatientModal()"
                    class="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Modal Content -->
        <div class="overflow-y-auto max-h-[calc(95vh-140px)]">
          <div class="p-8">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <!-- Basic Information -->
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Basic Information</h3>
                  
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Full Name</label>
                      <p class="mt-1 text-sm text-gray-900">{{ selectedPatient.full_name }}</p>
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Email</label>
                      <p class="mt-1 text-sm text-gray-900">{{ selectedPatient.email }}</p>
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Phone</label>
                      <p class="mt-1 text-sm text-gray-900">{{ selectedPatient.phone }}</p>
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Date of Birth</label>
                      <p class="mt-1 text-sm text-gray-900">{{ formatDate(selectedPatient.date_of_birth) }}</p>
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Age</label>
                      <p class="mt-1 text-sm text-gray-900">{{ calculateAge(selectedPatient.date_of_birth) }} years old</p>
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Gender</label>
                      <p class="mt-1">
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                              [ngClass]="getGenderBadgeClass(selectedPatient.gender)">
                          {{ selectedPatient.gender }}
                        </span>
                      </p>
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Address</label>
                      <p class="mt-1 text-sm text-gray-900">{{ selectedPatient.address }}</p>
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Emergency Contact</label>
                      <p class="mt-1 text-sm text-gray-900">{{ selectedPatient.emergency_contact }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Medical Information -->
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Medical Information</h3>
                  
                  <div class="space-y-4">
                    <!-- Allergies -->
                    <div *ngIf="selectedPatient.allergies && selectedPatient.allergies.length > 0">
                      <label class="block text-sm font-medium text-gray-700">Allergies</label>
                      <div class="mt-1 flex flex-wrap gap-2">
                        <span *ngFor="let allergy of selectedPatient.allergies"
                              class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                          {{ allergy }}
                        </span>
                      </div>
                    </div>
                    
                    <!-- Chronic Conditions -->
                    <div *ngIf="selectedPatient.chronic_conditions && selectedPatient.chronic_conditions.length > 0">
                      <label class="block text-sm font-medium text-gray-700">Chronic Conditions</label>
                      <div class="mt-1 flex flex-wrap gap-2">
                        <span *ngFor="let condition of selectedPatient.chronic_conditions"
                              class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                          {{ condition }}
                        </span>
                      </div>
                    </div>
                    
                    <!-- Current Medications -->
                    <div *ngIf="selectedPatient.medications && selectedPatient.medications.length > 0">
                      <label class="block text-sm font-medium text-gray-700">Current Medications</label>
                      <div class="mt-1 flex flex-wrap gap-2">
                        <span *ngFor="let medication of selectedPatient.medications"
                              class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {{ medication }}
                        </span>
                      </div>
                    </div>
                    
                    <!-- Vaccination Status -->
                    <div *ngIf="selectedPatient.vaccination_status">
                      <label class="block text-sm font-medium text-gray-700">Vaccination Status</label>
                      <p class="mt-1">
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                              [ngClass]="getVaccinationBadgeClass(selectedPatient.vaccination_status)">
                          {{ selectedPatient.vaccination_status.replace('_', ' ') | titlecase }}
                        </span>
                      </p>
                    </div>
                    
                    <!-- Medical History -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Medical History</label>
                      <div class="mt-1 bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p class="text-sm text-gray-900">{{ selectedPatient.medical_history || 'No medical history recorded' }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Visit History Section -->
            <div class="mt-8 border-t pt-6">
              <h3 class="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Visit History</h3>
              
              <div class="space-y-4">
                <div *ngIf="selectedPatient.last_visit" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div class="flex items-center space-x-3">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                      <p class="text-sm font-medium text-blue-900">Last Visit</p>
                      <p class="text-sm text-blue-700">{{ formatDate(selectedPatient.last_visit) }}</p>
                    </div>
                  </div>
                </div>
                
                <div *ngIf="!selectedPatient.last_visit" class="text-center py-6">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <p class="mt-2 text-sm text-gray-500">No visit history available</p>
                </div>
              </div>
            </div>

            <!-- Record Information -->
            <div class="mt-8 border-t pt-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Patient Since</label>
                  <p class="mt-1 text-sm text-gray-900">{{ formatDate(selectedPatient.created_at) }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Record Status</label>
                  <p class="mt-1">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                          [ngClass]="selectedPatient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                      {{ selectedPatient.status | titlecase }}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="bg-gray-50 px-8 py-4 border-t">
          <div class="flex justify-end space-x-3">
            <button (click)="closePatientModal()"
                    class="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
              Close
            </button>
            <button class="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all">
              Edit Record
            </button>
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

    /* Modal specific styles */
    .fixed {
      position: fixed !important;
      z-index: 9999 !important;
    }

    /* Ensure modal content is scrollable and properly sized */
    .max-h-\\[95vh\\] {
      max-height: 95vh !important;
    }

    .max-h-\\[calc\\(95vh-140px\\)\\] {
      max-height: calc(95vh - 140px) !important;
    }

    /* Badge styles */
    .rounded-full {
      border-radius: 9999px;
    }
  `]
})
export class PatientRecordsComponent implements OnInit {
  loading = true;
  error: string | null = null;
  searchTerm = '';
  statusFilter = '';
  showPatientModal = false;
  selectedPatient: Patient | null = null;

  patients: Patient[] = [];
  filteredPatients: Patient[] = [];

  constructor() { }

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
    this.selectedPatient = patient;
    this.showPatientModal = true;
  }

  closePatientModal(): void {
    this.showPatientModal = false;
    this.selectedPatient = null;
  }

  calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  getGenderBadgeClass(gender: string): string {
    switch (gender?.toLowerCase()) {
      case 'male':
        return 'bg-blue-100 text-blue-800';
      case 'female':
        return 'bg-pink-100 text-pink-800';
      case 'other':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getVaccinationBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'fully_vaccinated':
        return 'bg-green-100 text-green-800';
      case 'partially_vaccinated':
        return 'bg-yellow-100 text-yellow-800';
      case 'not_vaccinated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        medical_history: 'No significant medical history. Regular checkups show good overall health.',
        created_at: '2024-01-15T10:30:00Z',
        last_visit: '2024-12-01T14:30:00Z',
        status: 'active',
        allergies: ['Peanuts', 'Shellfish'],
        chronic_conditions: [],
        medications: ['Multivitamin', 'Vitamin D3'],
        vaccination_status: 'fully_vaccinated'
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
        medical_history: 'Allergic to penicillin. Had appendectomy in 2018. Generally healthy.',
        created_at: '2024-02-20T09:15:00Z',
        last_visit: '2024-11-28T11:00:00Z',
        status: 'active',
        allergies: ['Penicillin', 'Latex'],
        chronic_conditions: [],
        medications: ['Ibuprofen 400mg as needed'],
        vaccination_status: 'fully_vaccinated'
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
        medical_history: 'Diagnosed with Type 2 Diabetes in 2020. Managing well with medication and diet.',
        created_at: '2024-03-10T16:45:00Z',
        status: 'inactive',
        allergies: [],
        chronic_conditions: ['Type 2 Diabetes', 'Hypertension'],
        medications: ['Metformin 500mg twice daily', 'Lisinopril 10mg daily'],
        vaccination_status: 'partially_vaccinated'
      },
      {
        id: 'PAT004',
        full_name: 'David Kim',
        email: 'david.kim@email.com',
        phone: '+1 (555) 456-7890',
        date_of_birth: '1992-05-18',
        gender: 'Male',
        address: '321 Elm St, City, State 12345',
        emergency_contact: 'Anna Kim - +1 (555) 654-3210',
        medical_history: 'History of seasonal allergies. No major medical issues.',
        created_at: '2024-04-05T11:20:00Z',
        last_visit: '2024-12-10T09:30:00Z',
        status: 'active',
        allergies: ['Pollen', 'Dust mites'],
        chronic_conditions: ['Seasonal Allergies'],
        medications: ['Claritin 10mg daily during allergy season'],
        vaccination_status: 'fully_vaccinated'
      }
    ];
  }
}
