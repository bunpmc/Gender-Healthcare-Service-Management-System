import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

interface PatientFormData {
  full_name: string;
  date_of_birth: string;
  gender: string;
  phone_number: string;
  email: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_history: string;
  allergies: string;
  current_medications: string;
  insurance_provider: string;
  insurance_number: string;
}

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <!-- Header Background -->
      <div class="bg-gradient-to-r from-indigo-600 via-purple-700 to-pink-800 h-32 relative overflow-hidden">
        <div class="absolute inset-0 bg-black opacity-10"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent"></div>
      </div>

      <div class="relative -mt-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <!-- Page Header -->
        <div class="bg-white rounded-xl shadow-xl p-6 mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Patient Registration
              </h1>
              <p class="mt-2 text-gray-600">Register a new patient in the system</p>
            </div>
            <div class="flex space-x-3">
              <button 
                type="button"
                (click)="resetForm()"
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Reset Form
              </button>
            </div>
          </div>
        </div>

        <!-- Registration Form -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <form #patientForm="ngForm" (ngSubmit)="onSubmit(patientForm)" class="space-y-8">
            
            <!-- Personal Information Section -->
            <div class="p-6 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <svg class="h-5 w-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Personal Information
              </h2>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label for="full_name" class="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    required
                    [(ngModel)]="patientData.full_name"
                    #fullName="ngModel"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter patient's full name"
                    [class.border-red-500]="formSubmitted && fullName.invalid">
                  <div *ngIf="formSubmitted && fullName.invalid" class="mt-1 text-sm text-red-600">
                    Full name is required
                  </div>
                </div>

                <div>
                  <label for="date_of_birth" class="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    required
                    [(ngModel)]="patientData.date_of_birth"
                    #dateOfBirth="ngModel"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    [class.border-red-500]="formSubmitted && dateOfBirth.invalid">
                  <div *ngIf="formSubmitted && dateOfBirth.invalid" class="mt-1 text-sm text-red-600">
                    Date of birth is required
                  </div>
                </div>

                <div>
                  <label for="gender" class="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    [(ngModel)]="patientData.gender"
                    #gender="ngModel"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    [class.border-red-500]="formSubmitted && gender.invalid">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                  <div *ngIf="formSubmitted && gender.invalid" class="mt-1 text-sm text-red-600">
                    Gender is required
                  </div>
                </div>

                <div>
                  <label for="phone_number" class="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    required
                    [(ngModel)]="patientData.phone_number"
                    #phoneNumber="ngModel"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="+1 (555) 123-4567"
                    [class.border-red-500]="formSubmitted && phoneNumber.invalid">
                  <div *ngIf="formSubmitted && phoneNumber.invalid" class="mt-1 text-sm text-red-600">
                    Phone number is required
                  </div>
                </div>

                <div>
                  <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    [(ngModel)]="patientData.email"
                    #email="ngModel"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="patient@example.com"
                    [class.border-red-500]="formSubmitted && email.invalid && email.touched">
                  <div *ngIf="formSubmitted && email.invalid && email.touched" class="mt-1 text-sm text-red-600">
                    Please enter a valid email address
                  </div>
                </div>

                <div class="md:col-span-2">
                  <label for="address" class="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows="3"
                    [(ngModel)]="patientData.address"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter patient's address"></textarea>
                </div>
              </div>
            </div>

            <!-- Emergency Contact Section -->
            <div class="p-6 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <svg class="h-5 w-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                Emergency Contact
              </h2>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label for="emergency_contact_name" class="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    [(ngModel)]="patientData.emergency_contact_name"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Emergency contact name">
                </div>

                <div>
                  <label for="emergency_contact_phone" class="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    [(ngModel)]="patientData.emergency_contact_phone"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="+1 (555) 123-4567">
                </div>
              </div>
            </div>

            <!-- Medical Information Section -->
            <div class="p-6 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <svg class="h-5 w-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Medical Information
              </h2>
              
              <div class="space-y-6">
                <div>
                  <label for="medical_history" class="block text-sm font-medium text-gray-700 mb-2">
                    Medical History
                  </label>
                  <textarea
                    id="medical_history"
                    name="medical_history"
                    rows="3"
                    [(ngModel)]="patientData.medical_history"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Previous medical conditions, surgeries, etc."></textarea>
                </div>

                <div>
                  <label for="allergies" class="block text-sm font-medium text-gray-700 mb-2">
                    Allergies
                  </label>
                  <textarea
                    id="allergies"
                    name="allergies"
                    rows="2"
                    [(ngModel)]="patientData.allergies"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Known allergies to medications, foods, etc."></textarea>
                </div>

                <div>
                  <label for="current_medications" class="block text-sm font-medium text-gray-700 mb-2">
                    Current Medications
                  </label>
                  <textarea
                    id="current_medications"
                    name="current_medications"
                    rows="2"
                    [(ngModel)]="patientData.current_medications"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Current medications and dosages"></textarea>
                </div>
              </div>
            </div>

            <!-- Insurance Information Section -->
            <div class="p-6">
              <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <svg class="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                Insurance Information
              </h2>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label for="insurance_provider" class="block text-sm font-medium text-gray-700 mb-2">
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    id="insurance_provider"
                    name="insurance_provider"
                    [(ngModel)]="patientData.insurance_provider"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Insurance company name">
                </div>

                <div>
                  <label for="insurance_number" class="block text-sm font-medium text-gray-700 mb-2">
                    Insurance Number
                  </label>
                  <input
                    type="text"
                    id="insurance_number"
                    name="insurance_number"
                    [(ngModel)]="patientData.insurance_number"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Policy or member number">
                </div>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                (click)="resetForm()"
                class="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="isSubmitting"
                class="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                <svg *ngIf="isSubmitting" class="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span *ngIf="!isSubmitting">Register Patient</span>
                <span *ngIf="isSubmitting">Registering...</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Success Message -->
        <div *ngIf="showSuccessMessage" class="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <div class="flex">
            <svg class="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-sm">Patient registered successfully!</span>
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
export class PatientRegistrationComponent implements OnInit {
  formSubmitted = false;
  isSubmitting = false;
  showSuccessMessage = false;

  patientData: PatientFormData = {
    full_name: '',
    date_of_birth: '',
    gender: '',
    phone_number: '',
    email: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    insurance_provider: '',
    insurance_number: ''
  };

  constructor() {}

  ngOnInit(): void {
    console.log('👥 Patient Registration component initialized');
  }

  async onSubmit(form: NgForm): Promise<void> {
    this.formSubmitted = true;

    if (form.valid) {
      this.isSubmitting = true;

      try {
        console.log('📝 Registering patient:', this.patientData);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Show success message
        this.showSuccessMessage = true;
        
        // Reset form after success
        setTimeout(() => {
          this.resetForm();
          this.showSuccessMessage = false;
        }, 3000);

      } catch (error) {
        console.error('❌ Error registering patient:', error);
      } finally {
        this.isSubmitting = false;
      }
    } else {
      console.log('❌ Form is invalid');
    }
  }

  resetForm(): void {
    this.formSubmitted = false;
    this.isSubmitting = false;
    this.showSuccessMessage = false;
    
    this.patientData = {
      full_name: '',
      date_of_birth: '',
      gender: '',
      phone_number: '',
      email: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      medical_history: '',
      allergies: '',
      current_medications: '',
      insurance_provider: '',
      insurance_number: ''
    };
  }
}
