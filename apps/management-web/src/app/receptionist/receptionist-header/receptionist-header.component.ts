import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-receptionist-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Modern Reception Portal Header -->
    <header class="bg-gradient-to-r from-white via-blue-50 to-indigo-50 shadow-xl border border-white/20 backdrop-blur-sm p-6 m-6 rounded-2xl relative z-50">
      <div class="flex justify-between items-center relative">

        <!-- Portal Title & Receptionist Name -->
        <div class="flex items-center space-x-4">
          <div class="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900">GenderCare Reception Portal</h1>
            <p class="text-sm text-indigo-600 font-medium">Welcome, {{ receptionistName }}</p>
          </div>
        </div>

        <!-- Action Buttons & User Menu -->
        <div class="flex items-center space-x-4 relative z-40">
          <!-- Quick Actions -->
          <div class="hidden md:flex items-center space-x-3 relative z-30">
            <!-- New Appointment Button -->
            <button
              (click)="quickAction('new-appointment')"
              class="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg relative z-20 cursor-pointer">
              <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              <span class="pointer-events-none">New Appointment</span>
            </button>

            <!-- Patient Check-in Button -->
            <button
              (click)="quickAction('check-in')"
              class="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg relative z-20 cursor-pointer">
              <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="pointer-events-none">Check-in</span>
            </button>
          </div>

          <!-- Notifications -->
          <div class="relative z-30">
            <button
              (click)="toggleNotifications()"
              class="p-3 text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all duration-300 transform hover:scale-105 relative z-20 cursor-pointer">
              <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM10.5 3.5L6 8h4v12l5-5-4.5-4.5z"></path>
              </svg>
              <!-- Notification Badge -->
              <span class="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center pointer-events-none z-10">3</span>
            </button>

            <!-- Notifications Dropdown -->
            <div
              *ngIf="showNotifications"
              class="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 z-[9999] overflow-hidden">
              <div class="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                <h3 class="font-bold text-gray-900">Notifications</h3>
                <p class="text-sm text-indigo-600">Recent updates and alerts</p>
              </div>
              <div class="p-4 max-h-64 overflow-y-auto">
                <div class="space-y-3">
                  <div class="flex items-start space-x-3 p-3 bg-blue-50 rounded-xl">
                    <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">New appointment scheduled</p>
                      <p class="text-xs text-gray-500">John Doe - 2:30 PM today</p>
                    </div>
                  </div>
                  <div class="flex items-start space-x-3 p-3 bg-yellow-50 rounded-xl">
                    <div class="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">Patient check-in reminder</p>
                      <p class="text-xs text-gray-500">Sarah Johnson - Waiting</p>
                    </div>
                  </div>
                  <div class="flex items-start space-x-3 p-3 bg-green-50 rounded-xl">
                    <div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">System update completed</p>
                      <p class="text-xs text-gray-500">All systems operational</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- User Profile Dropdown -->
          <div class="relative z-30">
            <button
              (click)="toggleUserMenu()"
              class="flex items-center space-x-3 p-2 rounded-xl hover:bg-indigo-50 transition-all duration-300 transform hover:scale-105 relative z-20 cursor-pointer">
              <div class="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg pointer-events-none">
                <span class="text-white font-bold text-sm pointer-events-none">{{ getInitials() }}</span>
              </div>
              <div class="hidden lg:block text-left pointer-events-none">
                <p class="text-sm font-bold text-gray-900">{{ receptionistName }}</p>
                <p class="text-xs text-indigo-600 font-medium">Reception Staff</p>
              </div>
              <svg class="w-4 h-4 text-gray-600 transition-transform duration-300 pointer-events-none" [class.rotate-180]="showUserMenu" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <!-- User Dropdown Menu -->
            <div
              *ngIf="showUserMenu"
              class="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 z-[9999] overflow-hidden">
              <div class="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                <div class="flex items-center space-x-3">
                  <div class="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center">
                    <span class="text-white font-bold">{{ getInitials() }}</span>
                  </div>
                  <div>
                    <p class="font-bold text-gray-900">{{ receptionistName }}</p>
                    <p class="text-sm text-indigo-600 font-medium">Reception Staff</p>
                  </div>
                </div>
              </div>

              <div class="p-2">
                <a href="#" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 rounded-xl transition-all duration-200 cursor-pointer">
                  <svg class="w-5 h-5 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Profile Settings
                </a>
                <a href="#" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 rounded-xl transition-all duration-200 cursor-pointer">
                  <svg class="w-5 h-5 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  Settings
                </a>
                <hr class="my-2 border-gray-200">
                <button
                  (click)="logout()"
                  class="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 cursor-pointer">
                  <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    /* Modern Reception Portal Header Styles */

    :host {
      display: block;
      position: relative;
      z-index: 1000;
    }

    /* Header Element - Ensure proper stacking context */
    header {
      position: relative;
      z-index: 1000;
    }

    /* Action Buttons - Ensure they are clickable and visible */
    button {
      position: relative;
      z-index: 100;
      cursor: pointer !important;
      pointer-events: auto !important;
    }

    button:hover {
      z-index: 110;
    }

    /* Dropdown Menus - Highest priority */
    .z-\\[9999\\] {
      z-index: 9999 !important;
      position: absolute !important;
    }

    /* Notification and User Menu Containers */
    .relative.z-30 {
      z-index: 30;
      position: relative;
    }

    /* Quick Actions Container */
    .relative.z-40 {
      z-index: 40;
      position: relative;
    }

    /* Ensure dropdowns appear above everything */
    .absolute.right-0 {
      position: absolute !important;
      right: 0 !important;
      top: 100% !important;
      margin-top: 0.75rem !important;
    }

    /* Prevent pointer events on child elements of buttons */
    button * {
      pointer-events: none !important;
    }

    /* Ensure button text and icons don't interfere */
    .pointer-events-none {
      pointer-events: none !important;
    }

    /* Header animations */
    @keyframes slideInFromTop {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    header {
      animation: slideInFromTop 0.8s ease-out;
    }

    /* Button hover effects */
    button:hover {
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }

    /* Dropdown animations */
    .absolute.right-0 {
      animation: fadeInScale 0.2s ease-out;
    }

    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    /* Ensure proper backdrop blur support */
    .backdrop-blur-lg {
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }

    .backdrop-blur-sm {
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .absolute.right-0 {
        right: 1rem !important;
        left: auto !important;
        width: 280px !important;
        max-width: calc(100vw - 2rem) !important;
      }
    }
  `]
})
export class ReceptionistHeaderComponent implements OnInit {
  receptionistName: string = '';
  showUserMenu: boolean = false;
  showNotifications: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadReceptionistInfo();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const headerElement = target.closest('app-receptionist-header');

    // Close dropdowns if clicking outside the header component
    if (!headerElement) {
      this.showUserMenu = false;
      this.showNotifications = false;
    }
  }

  loadReceptionistInfo(): void {
    // Get receptionist info from localStorage or API
    this.receptionistName = localStorage.getItem('receptionist_name') || localStorage.getItem('staff_name') || 'Reception Staff';
  }

  getInitials(): string {
    return this.receptionistName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    // Close notifications if open
    if (this.showUserMenu) {
      this.showNotifications = false;
    }
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    // Close user menu if open
    if (this.showNotifications) {
      this.showUserMenu = false;
    }
  }

  quickAction(action: string): void {
    console.log('⚡ Quick action triggered:', action);

    switch (action) {
      case 'new-appointment':
        this.router.navigate(['/receptionist/dashboard/appointments'], {
          queryParams: { action: 'new' }
        });
        break;
      case 'check-in':
        this.router.navigate(['/receptionist/dashboard/reception-tasks'], {
          queryParams: { action: 'check-in' }
        });
        break;
      default:
        console.warn('Unknown quick action:', action);
    }
  }

  logout(): void {
    // Clear authentication data
    localStorage.removeItem('role');
    localStorage.removeItem('staff_id');
    localStorage.removeItem('receptionist_id');
    localStorage.removeItem('receptionist_name');
    localStorage.removeItem('receptionist_redirect_url');

    console.log('🚪 Receptionist logged out');

    // Redirect to login page
    this.router.navigate(['/login']);
  }
}
