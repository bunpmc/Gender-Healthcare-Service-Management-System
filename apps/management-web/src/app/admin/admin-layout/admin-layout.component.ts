import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <div class="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <!-- Admin Header -->
      <app-header></app-header>
      
      <!-- Main Content Area -->
      <div class="flex flex-row mx-6 gap-6 mb-4 flex-1">
        <!-- Sidebar Navigation -->
        <app-sidebar class="w-64 flex-shrink-0"></app-sidebar>
        
        <!-- Dynamic Content Area -->
        <div class="flex-1 p-2">
          <!-- Router Outlet for Admin Pages -->
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Ensure smooth transitions */
    .flex-1 {
      transition: all 0.3s ease-in-out;
    }
    
    /* Loading animation for route transitions */
    :host {
      display: block;
      animation: fadeIn 0.3s ease-in-out;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class AdminLayoutComponent {
  constructor() {
    console.log('🏗️ Admin Layout Component initialized');
  }
}
