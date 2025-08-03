import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NotificationComponent } from '../../shared/components/notification/notification.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NotificationComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Main Content -->
      <main class="relative">
        <router-outlet></router-outlet>
      </main>
      
      <!-- Global Notifications -->
      <app-notification></app-notification>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class LayoutComponent {}
