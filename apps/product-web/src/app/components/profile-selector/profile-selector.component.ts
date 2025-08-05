import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ProfileService } from '../../services/profile.service';
import { UserProfile } from '../../models/profile.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile-selector',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="profile-selector-container mb-6" *ngIf="isLoggedIn">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-800">Quick Fill from Saved Profiles</h3>
          <p class="text-sm text-gray-600">Select a saved profile to auto-fill the form</p>
        </div>
        <button
          *ngIf="!showProfiles && profiles.length > 0"
          (click)="showProfiles = true"
          class="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Show Profiles ({{ profiles.length }})
        </button>
        <button
          *ngIf="showProfiles"
          (click)="showProfiles = false"
          class="text-gray-600 hover:text-gray-800 text-sm font-medium"
        >
          Hide Profiles
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex items-center justify-center py-4">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600 text-sm">Loading profiles...</span>
      </div>

      <!-- No Profiles -->
      <div *ngIf="!loading && profiles.length === 0" class="text-center py-6 bg-gray-50 rounded-xl">
        <div class="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
        <p class="text-gray-600 text-sm">No saved profiles yet</p>
        <p class="text-gray-500 text-xs mt-1">Profiles will be saved when you complete appointments</p>
      </div>

      <!-- Profiles List -->
      <div *ngIf="!loading && profiles.length > 0 && showProfiles" class="space-y-3">
        <div 
          *ngFor="let profile of profiles; trackBy: trackByProfileId"
          class="profile-card bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
          (click)="selectProfile(profile)"
        >
          <div class="flex items-center space-x-4">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span class="text-white font-semibold">
                {{ profile.full_name.charAt(0).toUpperCase() }}
              </span>
            </div>
            
            <div class="flex-1">
              <h4 class="font-semibold text-gray-800">{{ profile.full_name }}</h4>
              <div class="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span class="capitalize">{{ profile.gender }}</span>
                <span>{{ profile.phone }}</span>
                <span *ngIf="profile.email">{{ profile.email }}</span>
              </div>
            </div>
            
            <div class="text-blue-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Profile Indicator -->
      <div *ngIf="selectedProfile" class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-blue-800">
              Form filled with: {{ selectedProfile.full_name }}
            </p>
            <p class="text-xs text-blue-600">
              You can still edit the information below if needed
            </p>
          </div>
          <button
            (click)="clearSelection()"
            class="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-card {
      transition: all 0.2s ease;
    }
    
    .profile-card:hover {
      transform: translateY(-1px);
    }
  `]
})
export class ProfileSelectorComponent implements OnInit {
  @Output() profileSelected = new EventEmitter<UserProfile>();
  @Output() profileCleared = new EventEmitter<void>();

  profiles: UserProfile[] = [];
  loading = true;
  showProfiles = false;
  selectedProfile: UserProfile | null = null;
  isLoggedIn = false;

  constructor(
    private profileService: ProfileService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isAuthenticated();
    if (this.isLoggedIn) {
      this.loadProfiles();
    }
  }

  loadProfiles() {
    this.loading = true;
    this.profileService.getUserProfiles().subscribe({
      next: (profiles) => {
        this.profiles = profiles;
        this.loading = false;
        // Auto-show profiles if there are any
        if (profiles.length > 0) {
          this.showProfiles = true;
        }
      },
      error: (error) => {
        console.error('Error loading profiles:', error);
        this.loading = false;
      }
    });
  }

  selectProfile(profile: UserProfile) {
    this.selectedProfile = profile;
    this.profileSelected.emit(profile);
    this.showProfiles = false;
  }

  clearSelection() {
    this.selectedProfile = null;
    this.profileCleared.emit();
  }

  trackByProfileId(index: number, profile: UserProfile): string {
    return profile.id;
  }
}
