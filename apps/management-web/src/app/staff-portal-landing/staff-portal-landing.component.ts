import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-staff-portal-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <!-- Logo and Title -->
        <div class="mb-12">
          <div class="mx-auto h-24 w-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <svg class="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h1 class="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Healthcare Staff Portal
          </h1>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Secure access for healthcare professionals to manage patient care, appointments, and administrative tasks.
          </p>
        </div>

        <!-- Portal Access Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <!-- Admin Portal -->
          <div class="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-gray-100">
            <div class="h-16 w-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Admin Portal</h3>
            <p class="text-gray-600 mb-4">System administration, user management, and configuration settings.</p>
            <button
              (click)="navigateToPortal('admin')"
              class="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-red-600 hover:to-pink-700 transition-colors">
              Admin Login
            </button>
          </div>

          <!-- Doctor Portal -->
          <div class="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-gray-100">
            <div class="h-16 w-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Doctor Portal</h3>
            <p class="text-gray-600 mb-4">Patient management, appointments, medical records, and consultations.</p>
            <button
              (click)="navigateToPortal('doctor')"
              class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors">
              Doctor Login
            </button>
          </div>

          <!-- Receptionist Portal -->
          <div class="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-gray-100">
            <div class="h-16 w-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Reception Portal</h3>
            <p class="text-gray-600 mb-4">Appointment scheduling, patient registration, and front desk operations.</p>
            <button
              (click)="navigateToPortal('receptionist')"
              class="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors">
              Reception Login
            </button>
          </div>
        </div>

        <!-- Quick Login Button -->
        <div class="mb-8">
          <button
            (click)="navigateToLogin()"
            class="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200">
            <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
            </svg>
            Staff Login
          </button>
        </div>

        <!-- Demo Credentials -->
        <div class="bg-blue-50 rounded-xl p-6 border border-blue-200 max-w-2xl mx-auto">
          <h3 class="text-lg font-semibold text-blue-900 mb-4">Demo Credentials</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div class="text-center">
              <p class="font-medium text-blue-800">Admin</p>
              <p class="text-blue-700">admin&#64;example.com</p>
              <p class="text-blue-600">Password: 123456</p>
            </div>
            <div class="text-center">
              <p class="font-medium text-blue-800">Doctor</p>
              <p class="text-blue-700">Kisma&#64;example.com</p>
              <p class="text-blue-600">Password: 123456</p>
            </div>
            <div class="text-center">
              <p class="font-medium text-blue-800">Receptionist</p>
              <p class="text-blue-700">receptionist&#64;example.com</p>
              <p class="text-blue-600">Password: 123456</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-12 text-center text-gray-500 text-sm">
          <p>&copy; 2024 Healthcare Staff Portal. Secure access for healthcare professionals.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `]
})
export class StaffPortalLandingComponent implements OnInit {

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('🏥 Staff Portal Landing initialized');
  }

  navigateToPortal(portalType: string): void {
    console.log('🚀 Navigating to unified staff login for:', portalType);

    // All staff roles now use the unified login page
    this.router.navigate(['/login']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
