import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../supabase.service';
import { LoggerService } from '../../core/services/logger.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div class="max-w-md w-full space-y-8 p-8">
        <!-- Header -->
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <span class="text-white text-2xl">🏥</span>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">Reception Portal</h2>
          <p class="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        <!-- Login Form -->
        <form class="mt-8 space-y-6" (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="rounded-xl shadow-lg bg-white p-6 space-y-4">
            <!-- Email Field -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                [(ngModel)]="credentials.email"
                #emailInput="ngModel"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Enter your email">
              <div *ngIf="emailInput.invalid && emailInput.touched" class="mt-1 text-sm text-red-600">
                Please enter a valid email address
              </div>
            </div>

            <!-- Password Field -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                [(ngModel)]="credentials.password"
                #passwordInput="ngModel"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Enter your password">
              <div *ngIf="passwordInput.invalid && passwordInput.touched" class="mt-1 text-sm text-red-600">
                Password is required
              </div>
            </div>

            <!-- Error Message -->
            <div *ngIf="errorMessage" class="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-600">{{ errorMessage }}</p>
            </div>

            <!-- Success Message -->
            <div *ngIf="successMessage" class="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p class="text-sm text-green-600">{{ successMessage }}</p>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="isLoading || loginForm.invalid"
              class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
              <span *ngIf="isLoading" class="inline-flex items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
              <span *ngIf="!isLoading">Sign In</span>
            </button>
          </div>
        </form>

        <!-- Demo Credentials -->
        <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 class="text-sm font-medium text-yellow-800 mb-2">Demo Credentials:</h3>
          <div class="text-xs text-yellow-700 space-y-1">
            <p><strong>Email:</strong> receptionist&#64;hospital.com</p>
            <p><strong>Password:</strong> receptionist123</p>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
    }
  `]
})
export class LoginComponent implements OnInit {
    credentials = {
        email: '',
        password: ''
    };

    isLoading = false;
    errorMessage = '';
    successMessage = '';
    returnUrl = '/receptionist/dashboard';

    constructor(
        private supabaseService: SupabaseService,
        private router: Router,
        private route: ActivatedRoute,
        private logger: LoggerService
    ) { }

    ngOnInit(): void {
        // Get return URL from route parameters or default to dashboard
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/receptionist/dashboard';
        this.logger.info('🔐 Login component initialized, returnUrl:', this.returnUrl);
    }

    async onSubmit(): Promise<void> {
        if (!this.credentials.email || !this.credentials.password) {
            this.errorMessage = 'Please enter both email and password';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

        try {
            this.logger.info('🔐 Attempting login for:', this.credentials.email);

            const data = await this.supabaseService.signInWithEmail(
                this.credentials.email,
                this.credentials.password
            );

            if (data?.user) {
                this.successMessage = 'Login successful! Redirecting...';
                this.logger.info('✅ Login successful for user:', data.user.email);

                // Wait a moment to show success message, then redirect
                setTimeout(() => {
                    this.router.navigate([this.returnUrl]);
                }, 1000);
            } else {
                this.errorMessage = 'Login failed - please check your credentials';
                this.logger.error('❌ Login failed - no user returned');
            }
        } catch (error: any) {
            this.errorMessage = error.message || 'An unexpected error occurred';
            this.logger.error('❌ Login error:', error);
        } finally {
            this.isLoading = false;
        }
    }
}
