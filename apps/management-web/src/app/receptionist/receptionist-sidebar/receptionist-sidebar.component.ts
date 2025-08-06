import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LoggerService } from '../../core/services/logger.service';

interface NavigationItem {
  name: string;
  icon: string;
  route: string;
  description: string;
}

@Component({
  selector: 'app-receptionist-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Modern Reception Portal Sidebar -->
    <nav class="h-full flex flex-col bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-50 shadow-2xl border-r border-white/20 backdrop-blur-sm rounded-2xl mx-2 my-2">

      <!-- Sidebar Header -->
      <div class="p-4 lg:p-6 border-b border-indigo-100/50 rounded-t-2xl">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
            <span class="text-white text-lg lg:text-xl">🏥</span>
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="text-base lg:text-lg font-bold text-gray-900 truncate">Reception Portal</h2>
            <p class="text-xs lg:text-sm text-indigo-600 font-medium truncate">Healthcare Front Desk</p>
          </div>
        </div>
      </div>

      <!-- Navigation Menu -->
      <div class="flex-1 px-3 lg:px-4 py-4 lg:py-6 space-y-2 overflow-y-auto scrollbar-hidden">
        <div
          *ngFor="let item of navigationItems; let i = index"
          class="nav-item group"
          [style.animation-delay]="(i * 0.1) + 's'">
          <a
            [routerLink]="item.route"
            routerLinkActive="nav-active"
            [routerLinkActiveOptions]="{exact: item.route === '/receptionist/dashboard'}"
            class="nav-item group flex items-center px-3 lg:px-4 py-2 lg:py-3 text-gray-700 rounded-2xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-opacity-50">

            <!-- Enhanced Icon Container -->
            <div class="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mr-3 lg:mr-4 group-hover:from-indigo-200 group-hover:to-purple-200 transition-all duration-300 group-hover:rotate-3 group-hover:scale-110 flex-shrink-0">
              <span [innerHTML]="item.icon" class="text-indigo-600 group-hover:text-indigo-700 transition-colors duration-300 emoji-icon"></span>
            </div>

            <!-- Enhanced Text Content -->
            <div class="flex-1 min-w-0">
              <span class="font-semibold text-xs lg:text-sm group-hover:translate-x-1 transition-transform duration-300 block truncate">{{ item.name }}</span>
              <p class="text-xs text-gray-500 group-hover:text-indigo-500 transition-colors duration-300 mt-0.5 truncate hidden lg:block">{{ item.description }}</p>
            </div>

            <!-- Subtle Arrow Indicator -->
            <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0 ml-2">
              <span class="text-indigo-400">→</span>
            </div>
          </a>
        </div>
      </div>

      <!-- Quick Actions Section - Redesigned -->
      <div class="px-3 py-3 border-t border-indigo-100/50">
        <h3 class="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3">Quick Actions</h3>
        <div class="grid grid-cols-3 gap-2">
          <!-- New Appointment -->
          <button
            (click)="quickAction('new-appointment')"
            class="flex flex-col items-center p-2 text-center bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg border border-blue-200/50 transition-all duration-200 hover:shadow-sm">
            <div class="text-lg mb-1">📅</div>
            <span class="text-xs font-medium text-blue-700">New</span>
          </button>

          <!-- Approve Pending -->
          <button
            (click)="quickAction('approve-pending')"
            class="flex flex-col items-center p-2 text-center bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-lg border border-green-200/50 transition-all duration-200 hover:shadow-sm">
            <div class="text-lg mb-1">✅</div>
            <span class="text-xs font-medium text-green-700">Approve</span>
          </button>

          <!-- Process Payment -->
          <button
            (click)="quickAction('process-payment')"
            class="flex flex-col items-center p-2 text-center bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 rounded-lg border border-orange-200/50 transition-all duration-200 hover:shadow-sm">
            <div class="text-lg mb-1">💳</div>
            <span class="text-xs font-medium text-orange-700">Pay</span>
          </button>
        </div>
      </div>

      <!-- Footer Section - Compact -->
      <div class="px-2 py-2 border-t border-white/20">
        <div class="px-2 py-1.5 bg-green-50 rounded-lg border border-green-200/50">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div class="ml-2 min-w-0 flex-1">
              <p class="text-xs font-medium text-green-800 truncate">Reception Active</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    /* Modern Reception Portal Sidebar Styles */
    :host {
      display: block;
    }

    /* Navigation Item Base Styles */
    .nav-item {
      position: relative;
      transition: all 0.3s ease;
    }

    /* Navigation Link Styles */
    .nav-item a {
      transition: all 0.3s ease;
    }

    /* Active Navigation Item - Fixed Styling */
    .nav-active {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
      color: white !important;
      box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.3) !important;
      transform: scale(1.02) !important;
    }

    /* Active Navigation Item Icon Container */
    .nav-active .w-8,
    .nav-active .w-10 {
      background: rgba(255, 255, 255, 0.2) !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
    }

    /* Icon visibility fix - Emoji Icons */
    .emoji-icon {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .emoji-icon span {
      font-size: 1.125rem !important;
      opacity: 1 !important;
      visibility: visible !important;
      display: inline-block !important;
    }

    /* Active state icon fix */
    .nav-active .emoji-icon {
      color: white !important;
    }

    .nav-active .emoji-icon span {
      opacity: 1 !important;
      visibility: visible !important;
      display: inline-block !important;
      filter: none !important;
    }

    /* Text styling */
    .nav-active span:not(.emoji-icon span) {
      color: white !important;
      font-weight: 700 !important;
    }

    .nav-active p {
      color: rgba(199, 210, 254, 0.9) !important;
    }

    /* Hover effects for active items */
    .nav-active:hover {
      background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%) !important;
    }

    .nav-active:hover .emoji-icon span {
      opacity: 1 !important;
      visibility: visible !important;
    }

    /* Scrollbar Hidden Class */
    .scrollbar-hidden {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .scrollbar-hidden::-webkit-scrollbar {
      width: 0px;
      background: transparent;
    }

    /* Focus States */
    .nav-item:focus,
    .nav-item a:focus {
      outline: none !important;
      box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.5) !important;
    }
  `]
})
export class ReceptionistSidebarComponent implements OnInit {

  navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      icon: `<span class="text-lg">📊</span>`,
      route: '/receptionist/dashboard',
      description: 'Real-time overview'
    },
    {
      name: 'Appointment Management',
      icon: `<span class="text-lg">📅</span>`,
      route: '/receptionist/dashboard/appointment-management',
      description: 'Schedule & manage appointments'
    },
    {
      name: 'Payment Management',
      icon: `<span class="text-lg">💳</span>`,
      route: '/receptionist/dashboard/payment-management',
      description: 'Handle payments & billing'
    },
    {
      name: 'Patient Management',
      icon: `<span class="text-lg">👥</span>`,
      route: '/receptionist/dashboard/patient-management',
      description: 'Manage patient records'
    },
    {
      name: 'Staff Management',
      icon: `<span class="text-lg">👩‍⚕️</span>`,
      route: '/receptionist/dashboard/staff-management',
      description: 'View staff contacts'
    }
  ];

  constructor(private router: Router, private logger: LoggerService) { }

  ngOnInit(): void {
    this.logger.info('📋 Receptionist sidebar initialized');
  }

  quickAction(action: string): void {
    this.logger.debug('⚡ Quick action triggered:', action);

    switch (action) {
      case 'new-appointment':
        this.router.navigate(['/receptionist/dashboard/appointment-management']);
        break;
      case 'approve-pending':
        this.router.navigate(['/receptionist/dashboard/appointment-management'], {
          queryParams: { filter: 'pending' }
        });
        break;
      case 'process-payment':
        this.router.navigate(['/receptionist/dashboard/payment-management']);
        break;
      default:
        this.logger.warn('Unknown quick action:', action);
    }
  }
}
