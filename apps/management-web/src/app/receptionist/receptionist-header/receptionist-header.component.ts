import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-receptionist-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Clean Reception Portal Header -->
    <header class="bg-gradient-to-r from-white via-blue-50 to-indigo-50 shadow-xl border border-white/20 backdrop-blur-sm p-6 m-6 rounded-2xl">
      <div class="flex justify-between items-center">

        <!-- Portal Title & Receptionist Name -->
        <div class="flex items-center space-x-4">
          <div class="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900">Reception Portal</h1>
            <p class="text-sm text-indigo-600 font-medium">{{ receptionistName }}</p>
          </div>
        </div>

        <!-- Profile & Actions -->
        <div class="flex items-center space-x-3">
          <div class="relative">
            <button
              (click)="toggleUserMenu()"
              class="flex items-center space-x-3 px-3 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-white/40 hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <div class="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <span class="text-base font-medium text-gray-700">Reception</span>
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <!-- User Dropdown Menu -->
            <div *ngIf="showUserMenu" class="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-2 z-50">
              <div class="px-4 py-3 border-b border-gray-100">
                <p class="text-base font-semibold text-gray-900">{{ receptionistName }}</p>
                <p class="text-xs text-gray-500">Receptionist</p>
              </div>
              <div class="py-2">
                <button (click)="logout()" class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50/50 transition-colors">
                  <svg class="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    /* Clean Reception Portal Header Styles */

    :host {
      display: block;
      position: relative;
      z-index: 1000;
    }

    header {
      animation: slideInFromTop 0.8s ease-out;
    }

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

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadReceptionistInfo();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Close dropdowns when clicking outside
    if (!target.closest('.relative') && !target.closest('button')) {
      this.showUserMenu = false;
    }
  }

  loadReceptionistInfo(): void {
    // Load receptionist information from service or localStorage
    this.receptionistName = localStorage.getItem('receptionistName') || 'Receptionist';
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    // Clear authentication data
    localStorage.removeItem('receptionistName');
    localStorage.removeItem('authToken');
    
    // Navigate to login page
    this.router.navigate(['/auth/login']);
  }
}
