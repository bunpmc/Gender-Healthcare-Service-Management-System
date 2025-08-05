import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ProfileService } from '../../services/profile.service';
import { CreateProfileRequest } from '../../models/profile.model';

@Component({
  selector: 'app-profile-save-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
         (click)="onBackdropClick($event)">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100"
           (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold">Save Profile</h3>
              <p class="text-blue-100 text-sm">Save this information for future appointments</p>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <!-- Checking Existence -->
          <div *ngIf="checkingExistence" class="flex items-center justify-center py-4 mb-4">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span class="ml-2 text-gray-600">Checking if profile exists...</span>
          </div>

          <!-- Profile Already Exists -->
          <div *ngIf="!checkingExistence && existingProfile" class="mb-6">
            <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
                <div>
                  <h4 class="font-semibold text-yellow-800">Profile Already Exists</h4>
                  <p class="text-sm text-yellow-700">This profile information is already saved in your account.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- New Profile -->
          <div *ngIf="!checkingExistence && !existingProfile" class="mb-6">
            <p class="text-gray-700 mb-4">
              Would you like to save this information as a profile for faster booking in the future?
            </p>

            <!-- Profile Preview -->
            <div class="bg-gray-50 rounded-xl p-4 space-y-3">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <div>
                  <p class="font-semibold text-gray-800">{{ profileData.full_name }}</p>
                  <p class="text-sm text-gray-600 capitalize">{{ profileData.gender }}</p>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-2 text-sm">
                <div class="flex items-center space-x-2" *ngIf="profileData.phone">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  <span class="text-gray-600">{{ profileData.phone }}</span>
                </div>

                <div class="flex items-center space-x-2" *ngIf="profileData.email">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <span class="text-gray-600">{{ profileData.email }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div *ngIf="saving" class="flex items-center justify-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span class="ml-2 text-gray-600">Saving profile...</span>
          </div>

          <!-- Error Message -->
          <div *ngIf="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-red-700 text-sm">{{ error }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex space-x-3" *ngIf="!saving && !checkingExistence">
            <button
              (click)="onSave(false)"
              class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              {{ existingProfile ? 'Continue' : 'No, Continue Without Saving' }}
            </button>

            <button
              *ngIf="!existingProfile"
              (click)="onSave(true)"
              class="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              Yes, Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scale-100 {
      transform: scale(1);
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .bg-white {
      animation: slideIn 0.3s ease-out;
    }
  `]
})
export class ProfileSaveDialogComponent implements OnInit, OnChanges {
  @Input() profileData!: CreateProfileRequest;
  @Input() show = false;
  @Output() save = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  saving = false;
  error: string | null = null;
  existingProfile: any = null;
  checkingExistence = false;

  constructor(private profileService: ProfileService) { }

  ngOnInit() {
    if (this.show && this.profileData) {
      this.checkIfProfileExists();
    }
  }

  ngOnChanges() {
    if (this.show && this.profileData) {
      this.checkIfProfileExists();
    }
  }

  checkIfProfileExists() {
    this.checkingExistence = true;
    this.error = null;
    this.existingProfile = null;

    this.profileService.checkProfileExists(this.profileData).subscribe({
      next: (existingProfile) => {
        this.existingProfile = existingProfile;
        this.checkingExistence = false;
      },
      error: (error) => {
        console.error('Error checking profile existence:', error);
        this.checkingExistence = false;
      }
    });
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onSave(false);
    }
  }

  async onSave(shouldSave: boolean) {
    if (shouldSave && !this.existingProfile) {
      try {
        this.saving = true;
        this.error = null;

        await this.profileService.createProfile(this.profileData).toPromise();

        this.save.emit(true);
        this.close.emit();
      } catch (error: any) {
        if (error.message === 'This profile already exists') {
          this.error = 'This profile already exists in your account.';
        } else {
          this.error = error.message || 'Failed to save profile. Please try again.';
        }
        this.saving = false;
      }
    } else {
      this.save.emit(false);
      this.close.emit();
    }
  }
}
