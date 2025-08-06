import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ProfileService } from '../../services/profile.service';
import { UserProfile } from '../../models/profile.model';

@Component({
  selector: 'app-profile-management',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="profile-management-container">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">
            👤 Saved Profiles
          </h2>
          <p class="text-gray-600">
            Manage your saved profiles for faster appointment booking
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600">Loading profiles...</span>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <p class="text-red-700">{{ error }}</p>
        <button 
          (click)="loadProfiles()"
          class="mt-2 text-red-600 hover:text-red-800 font-medium text-sm"
        >
          Try Again
        </button>
      </div>

      <!-- No Profiles -->
      <div *ngIf="!loading && !error && profiles.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">👤</div>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">
          No Saved Profiles
        </h3>
        <p class="text-gray-500 mb-6">
          You haven't saved any profiles yet. Profiles will be created when you book appointments.
        </p>
      </div>

      <!-- Profiles List -->
      <div *ngIf="!loading && !error && profiles.length > 0" class="space-y-4">
        <div *ngFor="let profile of profiles; trackBy: trackByProfileId" 
             class="profile-card bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
          
          <!-- Profile Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span class="text-white font-semibold text-lg">
                  {{ profile.full_name.charAt(0).toUpperCase() }}
                </span>
              </div>
              
              <div>
                <h3 class="font-semibold text-gray-800 text-lg">
                  {{ profile.full_name }}
                </h3>
                <p class="text-sm text-gray-600 capitalize">
                  {{ profile.gender }}
                </p>
              </div>
            </div>
            
            <!-- Delete Button -->
            <button
              (click)="deleteProfile(profile)"
              [disabled]="deletingProfileId === profile.id"
              class="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              title="Delete Profile"
            >
              <div *ngIf="deletingProfileId === profile.id" class="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
              <svg *ngIf="deletingProfileId !== profile.id" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>

          <!-- Profile Details -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="flex items-center space-x-3">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <span class="text-gray-700">{{ profile.phone }}</span>
            </div>
            
            <div *ngIf="profile.email" class="flex items-center space-x-3">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <span class="text-gray-700">{{ profile.email }}</span>
            </div>
          </div>

          <!-- Profile Footer -->
          <div class="flex justify-between items-center pt-4 border-t border-gray-100">
            <p class="text-sm text-gray-500">
              Created: {{ formatDate(profile.created_at) }}
            </p>
            
            <div class="flex items-center space-x-2">
              <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-management-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .profile-card {
      transition: all 0.3s ease;
    }
    
    .profile-card:hover {
      transform: translateY(-2px);
    }
  `]
})
export class ProfileManagementComponent implements OnInit {
  profiles: UserProfile[] = [];
  loading = true;
  error: string | null = null;
  deletingProfileId: string | null = null;

  constructor(private profileService: ProfileService) {}

  ngOnInit() {
    this.loadProfiles();
  }

  loadProfiles() {
    this.loading = true;
    this.error = null;

    this.profileService.getUserProfiles().subscribe({
      next: (profiles) => {
        this.profiles = profiles;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load profiles. Please try again.';
        this.loading = false;
        console.error('Error loading profiles:', error);
      }
    });
  }

  deleteProfile(profile: UserProfile) {
    if (!confirm(`Are you sure you want to delete the profile for "${profile.full_name}"?`)) {
      return;
    }

    this.deletingProfileId = profile.id;

    this.profileService.deleteProfile(profile.id).subscribe({
      next: () => {
        this.profiles = this.profiles.filter(p => p.id !== profile.id);
        this.deletingProfileId = null;
      },
      error: (error) => {
        this.error = 'Failed to delete profile. Please try again.';
        this.deletingProfileId = null;
        console.error('Error deleting profile:', error);
      }
    });
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Unknown';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown';
    }
  }

  trackByProfileId(index: number, profile: UserProfile): string {
    return profile.id;
  }
}
