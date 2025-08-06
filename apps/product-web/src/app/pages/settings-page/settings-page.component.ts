import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
  ],
  template: `
    <body class="settings-page">
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
            <span class="breadcrumb-current">Settings</span>
          </div>
          
          <div class="page-title-section">
            <h1 class="page-title">Account Settings</h1>
            <p class="page-description">Manage your account preferences and settings</p>
          </div>
        </div>

        <div class="page-content">
          <div class="settings-container">
            <!-- Coming Soon Message -->
            <div class="coming-soon-section">
              <div class="coming-soon-icon">
                <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <h2 class="coming-soon-title">Settings Coming Soon</h2>
              <p class="coming-soon-description">
                We're working on bringing you comprehensive account settings. 
                This feature will be available in a future update.
              </p>
              
              <!-- Placeholder Settings Preview -->
              <div class="settings-preview">
                <h3 class="preview-title">Upcoming Features:</h3>
                <ul class="feature-list">
                  <li class="feature-item">
                    <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Profile Information Management
                  </li>
                  <li class="feature-item">
                    <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Notification Preferences
                  </li>
                  <li class="feature-item">
                    <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Privacy & Security Settings
                  </li>
                  <li class="feature-item">
                    <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Language & Region Preferences
                  </li>
                </ul>
              </div>
              
              <button (click)="goBack()" class="back-button">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <app-footer></app-footer>
    </body>
  `,
  styles: [`
    .settings-page {
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

    .settings-container {
      padding: 40px;
    }

    .coming-soon-section {
      text-align: center;
      max-width: 600px;
      margin: 0 auto;
    }

    .coming-soon-icon {
      margin-bottom: 24px;
    }

    .coming-soon-title {
      font-size: 24px;
      font-weight: 600;
      color: #2d3748;
      margin: 0 0 12px 0;
    }

    .coming-soon-description {
      font-size: 16px;
      color: #6b7280;
      line-height: 1.6;
      margin: 0 0 32px 0;
    }

    .settings-preview {
      background: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
      text-align: left;
    }

    .preview-title {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
      margin: 0 0 16px 0;
    }

    .feature-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      color: #4a5568;
      font-size: 14px;
    }

    .back-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(145deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .back-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(103, 126, 234, 0.3);
    }

    @media (max-width: 768px) {
      .page-container {
        padding: 12px;
      }
      
      .page-header {
        padding: 16px;
      }
      
      .settings-container {
        padding: 20px;
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
export class SettingsPageComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
