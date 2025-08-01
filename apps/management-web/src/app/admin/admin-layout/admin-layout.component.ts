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
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <!-- Admin Header -->
      <app-header></app-header>
      
      <!-- Main Content Area -->
      <div class="flex flex-row w-full flex-1 px-4 sm:px-6 lg:px-8 pb-12 gap-8">
        <!-- Sidebar Navigation -->
        <app-sidebar class="w-72 flex-shrink-0"></app-sidebar>
        
        <!-- Dynamic Content Area -->
        <div class="flex-1 flex flex-col gap-8">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .flex-1 {
      transition: all 0.3s ease-in-out;
    }
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
