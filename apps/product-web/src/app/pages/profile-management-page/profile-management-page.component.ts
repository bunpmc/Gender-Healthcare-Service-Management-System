import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ProfileManagementComponent } from '../../components/profile-management/profile-management.component';

@Component({
  selector: 'app-profile-management-page',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    ProfileManagementComponent,
  ],
  template: `
    <body class="profile-management-page">
      <!-- Header -->
      <app-header></app-header>

      <!-- Main Content -->
      <div class="page-container">
        <div class="page-header">
          <div class="breadcrumb">
            <button (click)="goBack()" class="breadcrumb-link">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Dashboard
            </button>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">Profile Management</span>
          </div>
          
          <div class="page-title-section">
            <h1 class="page-title">Saved Profiles</h1>
            <p class="page-description">Manage your saved patient profiles for quick appointment booking</p>
          </div>
        </div>

        <div class="page-content">
          <app-profile-management></app-profile-management>
        </div>
      </div>

      <!-- Footer -->
      <app-footer></app-footer>
    </body>
  `,
  styles: [`
    .profile-management-page {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }

    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      min-height: calc(100vh - 160px);
    }

    .page-header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .breadcrumb-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #667eea;
      text-decoration: none;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      transition: color 0.2s ease;
    }

    .breadcrumb-link:hover {
      color: #5a67d8;
    }

    .breadcrumb-separator {
      margin: 0 8px;
      color: #9ca3af;
    }

    .breadcrumb-current {
      color: #6b7280;
    }

    .page-title-section {
      text-align: center;
    }

    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: #2d3748;
      margin: 0 0 8px 0;
    }

    .page-description {
      font-size: 16px;
      color: #6b7280;
      margin: 0;
    }

    .page-content {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    @media (max-width: 768px) {
      .page-container {
        padding: 12px;
      }
      
      .page-header {
        padding: 16px;
      }
      
      .page-title {
        font-size: 24px;
      }
      
      .page-description {
        font-size: 14px;
      }
    }
  `]
})
export class ProfileManagementPageComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
