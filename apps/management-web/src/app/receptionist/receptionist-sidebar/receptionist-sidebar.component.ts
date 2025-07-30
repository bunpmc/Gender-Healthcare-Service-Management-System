import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

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
    <nav class="h-full flex flex-col bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-50 shadow-2xl border-r border-white/20 backdrop-blur-sm">

      <!-- Sidebar Header -->
      <div class="p-6 border-b border-indigo-100/50">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-900">Reception Portal</h2>
            <p class="text-sm text-indigo-600 font-medium">Healthcare Front Desk</p>
          </div>
        </div>
      </div>

      <!-- Navigation Menu -->
      <div class="flex-1 px-4 py-6 space-y-2">
        <div
          *ngFor="let item of navigationItems; let i = index"
          class="nav-item group"
          [style.animation-delay]="(i * 0.1) + 's'">
          <a
            [routerLink]="item.route"
            routerLinkActive="nav-active"
            [routerLinkActiveOptions]="{exact: item.route === '/receptionist/dashboard'}"
            class="nav-item group flex items-center px-4 py-3 text-gray-700 rounded-2xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-opacity-50">

            <!-- Enhanced Icon Container -->
            <div class="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mr-4 group-hover:from-indigo-200 group-hover:to-purple-200 transition-all duration-300 group-hover:rotate-3 group-hover:scale-110">
              <div [innerHTML]="item.icon" class="text-indigo-600 group-hover:text-indigo-700 transition-colors duration-300 flex items-center justify-center"></div>
            </div>

            <!-- Enhanced Text Content -->
            <div class="flex-1">
              <span class="font-semibold text-sm group-hover:translate-x-1 transition-transform duration-300 block">{{ item.name }}</span>
              <p class="text-xs text-gray-500 group-hover:text-indigo-500 transition-colors duration-300 mt-0.5">{{ item.description }}</p>
            </div>

            <!-- Subtle Arrow Indicator -->
            <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </a>
        </div>
      </div>

      <!-- Quick Actions Section -->
      <div class="px-4 py-4 border-t border-indigo-100/50">
        <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Quick Actions</h3>
        <div class="space-y-2">
          <button
            (click)="quickAction('new-appointment')"
            class="w-full flex items-center px-4 py-3 text-sm font-medium text-indigo-700 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-md">
            <div class="w-8 h-8 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-4 h-4 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </div>
            New Appointment
          </button>

          <button
            (click)="quickAction('approve-pending')"
            class="w-full flex items-center px-4 py-3 text-sm font-medium text-emerald-700 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-md">
            <div class="w-8 h-8 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            Approve Pending
          </button>

          <button
            (click)="quickAction('process-payment')"
            class="w-full flex items-center px-4 py-3 text-sm font-medium text-blue-700 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-md">
            <div class="w-8 h-8 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            Process Payment
          </button>
        </div>
      </div>

      <!-- Status Section -->
      <div class="px-4 py-4 border-t border-indigo-100/50">
        <div class="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50 shadow-sm">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="h-3 w-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-bold text-green-800">Reception Active</p>
              <p class="text-xs text-green-600 font-medium">All systems operational</p>
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

    /* Sidebar Container */
    nav {
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    /* Navigation Item Base Styles */
    .nav-item {
      position: relative;
      overflow: hidden;
      opacity: 0;
      animation: slideInFromLeft 0.6s ease-out forwards;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Navigation Link Base Styles */
    .nav-item a {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .nav-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      transition: left 0.5s;
    }

    .nav-item:hover::before {
      left: 100%;
    }

    /* Staggered Animation for Navigation Items */
    .nav-item:nth-child(1) { animation-delay: 0.1s; }
    .nav-item:nth-child(2) { animation-delay: 0.2s; }
    .nav-item:nth-child(3) { animation-delay: 0.3s; }
    .nav-item:nth-child(4) { animation-delay: 0.4s; }
    .nav-item:nth-child(5) { animation-delay: 0.5s; }
    .nav-item:nth-child(6) { animation-delay: 0.6s; }
    .nav-item:nth-child(7) { animation-delay: 0.7s; }

    @keyframes slideInFromLeft {
      from {
        opacity: 0;
        transform: translateX(-30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Active Navigation Item - Enhanced Styling */
    .nav-active {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
      color: white !important;
      box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.3), 0 10px 10px -5px rgba(79, 70, 229, 0.1) !important;
      transform: scale(1.02) !important;
      animation: activePulse 2s infinite !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
    }

    /* Active Navigation Item Icon Container */
    .nav-active .w-10 {
      background: rgba(255, 255, 255, 0.2) !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
      transform: rotate(0deg) scale(1.05) !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
    }

    /* Active Navigation Item SVG Icons */
    .nav-active svg {
      color: white !important;
      stroke: white !important;
    }

    /* Active Navigation Item Text */
    .nav-active span {
      color: white !important;
      font-weight: 700 !important;
    }

    .nav-active p {
      color: rgba(199, 210, 254, 0.9) !important;
    }

    /* Override hover effects for active items */
    .nav-active:hover {
      background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%) !important;
      transform: scale(1.02) !important;
    }

    .nav-active:hover .w-10 {
      background: rgba(255, 255, 255, 0.25) !important;
      transform: rotate(0deg) scale(1.05) !important;
    }

    .nav-active:hover svg {
      color: white !important;
    }

    .nav-active:hover span,
    .nav-active:hover p {
      color: white !important;
    }

    /* Enhanced Pulse Animation for Active Items */
    @keyframes activePulse {
      0%, 100% {
        box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.3), 0 10px 10px -5px rgba(79, 70, 229, 0.1);
      }
      50% {
        box-shadow: 0 25px 30px -5px rgba(79, 70, 229, 0.4), 0 15px 15px -5px rgba(79, 70, 229, 0.2);
      }
    }

    /* Enhanced Hover Effects - Only for non-active items */
    .nav-item:hover:not(.nav-active) {
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    /* Ensure active items maintain their styling during hover */
    .nav-item.nav-active:hover {
      box-shadow: 0 25px 30px -5px rgba(79, 70, 229, 0.4), 0 15px 15px -5px rgba(79, 70, 229, 0.2) !important;
    }

    /* Icon Container Animations */
    .nav-item .w-10 {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .nav-item:hover .w-10 {
      transform: rotate(5deg) scale(1.1);
    }

    /* SVG Icon Styling */
    .nav-item svg {
      width: 1.25rem !important;
      height: 1.25rem !important;
      stroke: currentColor !important;
      fill: none !important;
      stroke-width: 2 !important;
      color: inherit !important;
    }

    .nav-item .text-indigo-600 svg {
      color: #4f46e5 !important;
    }

    .nav-item:hover .text-indigo-600 svg {
      color: #4338ca !important;
    }

    /* Text Animations */
    .nav-item span {
      transition: all 0.3s ease;
    }

    .nav-item:hover:not(.nav-active) span {
      transform: translateX(2px);
    }

    /* Active item text should not translate */
    .nav-active span {
      transform: translateX(0) !important;
    }

    /* Arrow indicator for active items */
    .nav-active .opacity-0 {
      opacity: 1 !important;
    }

    .nav-active svg:last-child {
      color: rgba(255, 255, 255, 0.8) !important;
    }

    /* Pulse Animation for Active Items */
    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.3);
      }
      50% {
        box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5);
      }
    }

    /* Status Indicator Animation */
    @keyframes statusPulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.1);
      }
    }

    .animate-pulse {
      animation: statusPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    /* Focus States for Accessibility */
    .nav-item:focus,
    .nav-item a:focus {
      @apply outline-none ring-4 ring-indigo-300 ring-opacity-50;
    }

    .nav-item:focus-visible,
    .nav-item a:focus-visible {
      @apply outline-none ring-4 ring-indigo-300 ring-opacity-50;
    }

    /* Sidebar Header Animation */
    .p-6 {
      animation: slideInFromTop 0.6s ease-out;
    }

    @keyframes slideInFromTop {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Quick Actions and Status Section Animation */
    .border-t {
      animation: slideInFromBottom 0.6s ease-out 0.8s both;
    }

    @keyframes slideInFromBottom {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Scrollbar Styling */
    nav::-webkit-scrollbar {
      width: 6px;
    }

    nav::-webkit-scrollbar-track {
      @apply bg-transparent;
    }

    nav::-webkit-scrollbar-thumb {
      @apply bg-indigo-200 rounded-full;
    }

    nav::-webkit-scrollbar-thumb:hover {
      @apply bg-indigo-300;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .nav-item {
        @apply px-3 py-2;
      }

      .nav-item .w-10 {
        @apply w-8 h-8 mr-3;
      }

      .nav-item svg {
        @apply w-4 h-4;
      }

      .nav-item span {
        @apply text-xs;
      }

      .nav-item p {
        @apply hidden;
      }
    }

    /* Interactive Elements */
    .nav-item:active {
      transform: scale(0.98);
    }

    /* Glass Morphism Effect */
    .bg-gradient-to-r {
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
  `]
})
export class ReceptionistSidebarComponent implements OnInit {

  navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z"></path>
             </svg>`,
      route: '/receptionist/dashboard',
      description: 'Real-time overview'
    },
    {
      name: 'Payment Management',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
             </svg>`,
      route: '/receptionist/dashboard/payment-management',
      description: 'Service billing & payments'
    },
    {
      name: 'Appointment Management',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
             </svg>`,
      route: '/receptionist/dashboard/appointment-management',
      description: 'Create & approve appointments'
    },
    {
      name: 'Patient Management',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
             </svg>`,
      route: '/receptionist/dashboard/patient-management',
      description: 'CRU patient records'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('📋 Receptionist sidebar initialized');
  }

  quickAction(action: string): void {
    console.log('⚡ Quick action triggered:', action);

    switch (action) {
      case 'new-appointment':
        this.router.navigate(['/receptionist/dashboard/appointment-management'], {
          queryParams: { action: 'new' }
        });
        break;
      case 'approve-pending':
        this.router.navigate(['/receptionist/dashboard/appointment-management'], {
          queryParams: { action: 'approve' }
        });
        break;
      case 'process-payment':
        this.router.navigate(['/receptionist/dashboard/payment-management'], {
          queryParams: { action: 'process' }
        });
        break;
      default:
        console.warn('Unknown quick action:', action);
    }
  }
}
