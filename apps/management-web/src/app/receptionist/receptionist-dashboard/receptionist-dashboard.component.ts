import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ReceptionistHeaderComponent } from '../receptionist-header/receptionist-header.component';
import { ReceptionistSidebarComponent } from '../receptionist-sidebar/receptionist-sidebar.component';

@Component({
  selector: 'app-receptionist-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ReceptionistHeaderComponent,
    ReceptionistSidebarComponent
  ],
  template: `
    <div class="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <!-- Header -->
      <div class="flex-shrink-0">
        <app-receptionist-header></app-receptionist-header>
      </div>
      
      <!-- Main Content Area -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar -->
        <div class="flex-shrink-0 w-56 lg:w-60 xl:w-64 hidden md:block">
          <app-receptionist-sidebar class="h-full"></app-receptionist-sidebar>
        </div>
        
        <!-- Content Area -->
        <div class="flex-1 overflow-y-auto">
          <div class="p-4 lg:p-6">
            <router-outlet></router-outlet>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }

    /* Responsive sidebar for mobile */
    @media (max-width: 768px) {
      .w-64 {
        width: 100%;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 50;
        height: 100vh;
        transform: translateX(-100%);
        transition: transform 0.3s ease-in-out;
      }
      
      .w-64.show {
        transform: translateX(0);
      }
    }

    /* Ensure proper scrolling */
    .overflow-y-auto {
      scrollbar-width: thin;
      scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
    }

    .overflow-y-auto::-webkit-scrollbar {
      width: 6px;
    }

    .overflow-y-auto::-webkit-scrollbar-track {
      background: transparent;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb {
      background-color: rgba(156, 163, 175, 0.5);
      border-radius: 3px;
    }
  `]
})
export class ReceptionistDashboardComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    console.log('🏥 Receptionist Dashboard initialized');
  }
}
