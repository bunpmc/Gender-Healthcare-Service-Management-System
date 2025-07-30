import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../supabase.service';

// Real database authentication - no demo data

@Component({
  selector: 'app-staff-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
        <!-- Header -->
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h2 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Staff Portal
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Sign in to access your staff dashboard
          </p>
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div class="flex">
            <svg class="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-sm">{{ errorMessage }}</span>
          </div>
          <!-- Error Details -->
          <div *ngIf="errorDetails" class="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded border-l-4 border-red-400">
            <div class="flex justify-between items-start">
              <span class="font-mono">{{ errorDetails }}</span>
              <button
                type="button"
                (click)="copyErrorDetails()"
                class="ml-2 text-red-500 hover:text-red-700 transition-colors"
                title="Copy error details">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Admin Credentials Reminder -->
          <div *ngIf="errorMessage && (errorMessage.includes('Invalid') || errorMessage.includes('not found') || errorMessage.includes('failed'))"
               class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <p class="text-xs text-blue-700 font-medium mb-1">💡 Admin Login Credentials:</p>
            <p class="text-xs text-blue-600">📧 Email: An3439202&#64;gmail.com</p>
            <p class="text-xs text-blue-600">🔑 Password: 123456</p>
            <p class="text-xs text-blue-600">👤 Role: administrator</p>
          </div>
        </div>

        <!-- Login Form -->
        <form #loginForm="ngForm" (ngSubmit)="onSubmit(loginForm)" class="space-y-6">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              ngModel
              #email="ngModel"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Enter your email"
              [class.border-red-500]="formSubmitted && email.invalid">
            <div *ngIf="formSubmitted && email.invalid" class="mt-1 text-sm text-red-600">
              Please enter a valid email address
            </div>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                name="password"
                [type]="showPassword ? 'text' : 'password'"
                required
                ngModel
                #password="ngModel"
                class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Enter your password"
                [class.border-red-500]="formSubmitted && password.invalid">
              <button
                type="button"
                (click)="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <svg *ngIf="!showPassword" class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                <svg *ngIf="showPassword" class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                </svg>
              </button>
            </div>
            <div *ngIf="formSubmitted && password.invalid" class="mt-1 text-sm text-red-600">
              Password is required
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="isSubmitting"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
            <svg *ngIf="isSubmitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span *ngIf="!isSubmitting">Sign In</span>
            <span *ngIf="isSubmitting">Signing in...</span>
          </button>
        </form>

        <!-- Staff Login Info -->
        <div class="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <h3 class="text-sm font-medium text-indigo-800 mb-2">Staff Login Information:</h3>
          <div class="text-xs text-indigo-700 space-y-1">
            <div><strong>Default Password:</strong> 123456 (for all staff members)</div>
            <div><strong>Email:</strong> Use your registered working email address</div>
            <div class="mt-2 text-indigo-600">Contact administrator if you need assistance.</div>
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
export class StaffLoginComponent {
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);

  formSubmitted = false;
  isSubmitting = false;
  showPassword = false;
  errorMessage = '';
  errorDetails = '';

  async onSubmit(form: NgForm) {
    this.formSubmitted = true;
    this.errorMessage = '';
    this.errorDetails = '';

    if (form.valid) {
      this.isSubmitting = true;
      const { email, password } = form.value;

      try {
        console.log('🔍 Staff login attempt:', { email, timestamp: new Date().toISOString() });

        // Use enhanced authentication method
        const authResult = await this.supabaseService.authenticateStaff(email, password);

        if (!authResult.success) {
          // Display detailed error information
          this.errorMessage = authResult.error!.message;
          this.errorDetails = `Error Code: ${authResult.error!.code} | Time: ${new Date(authResult.error!.timestamp).toLocaleString()}`;

          console.error('❌ Authentication failed:', authResult.error);
          this.isSubmitting = false;
          return;
        }

        const staff = authResult.staff!;

        // Set user session with real database data
        localStorage.setItem('role', staff.role);
        localStorage.setItem('staff_id', staff.staff_id);
        localStorage.setItem('user_name', staff.full_name);
        localStorage.setItem('user_email', staff.working_email);
        localStorage.setItem('email', staff.working_email); // For compatibility with auth guards

        console.log('✅ Database authentication successful:', {
          role: staff.role,
          staff_id: staff.staff_id,
          name: staff.full_name,
          email: staff.working_email,
          timestamp: new Date().toISOString()
        });

        // Role-based routing
        this.redirectBasedOnRole(staff.role);

      } catch (error: any) {
        console.error('❌ Unexpected login error:', error);

        this.errorMessage = 'An unexpected error occurred. Please try again.';
        this.errorDetails = `Error: ${error.message} | Time: ${new Date().toLocaleString()}`;
        this.isSubmitting = false;
      }
    }
  }

  // Copy error details to clipboard for easy sharing
  copyErrorDetails() {
    if (this.errorDetails) {
      navigator.clipboard.writeText(`${this.errorMessage}\n${this.errorDetails}`).then(() => {
        console.log('Error details copied to clipboard');
      });
    }
  }

  private redirectBasedOnRole(role: string): void {
    console.log('🚀 Redirecting based on role:', role);

    switch (role) {
      case 'administrator': // Primary admin role from database
        console.log('✅ Administrator access granted, redirecting to admin dashboard');
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'admin': // Legacy admin role (backward compatibility)
      case 'manager':
        console.log('✅ Admin/Manager access granted, redirecting to admin dashboard');
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'doctor':
        console.log('✅ Doctor access granted, redirecting to doctor dashboard');
        this.router.navigate(['/doctor/dashboard']);
        break;
      case 'receptionist':
        console.log('✅ Receptionist access granted, redirecting to receptionist dashboard');
        this.router.navigate(['/receptionist/dashboard']);
        break;
      default:
        console.warn('⚠️ Unknown role:', role);
        this.errorMessage = `Invalid user role: "${role}". Please contact administrator.`;
        this.isSubmitting = false;
    }
  }
}
