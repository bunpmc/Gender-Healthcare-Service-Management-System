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
    <div class="flex flex-col min-h-screen bg-gray-50">
      <app-receptionist-header></app-receptionist-header>
      <div class="flex flex-row mx-6 gap-6 mb-4">
        <app-receptionist-sidebar class="w-64"></app-receptionist-sidebar>
        <div class="flex-1 p-2">
          <router-outlet></router-outlet>
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
export class ReceptionistDashboardComponent implements OnInit {

  constructor() {}

  ngOnInit(): void {
    console.log('🏥 Receptionist Dashboard initialized');
  }
}
