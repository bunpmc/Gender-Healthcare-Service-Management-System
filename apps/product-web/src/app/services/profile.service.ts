import { Injectable } from '@angular/core';
import { Observable, from, map, catchError, of, switchMap } from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import { UserProfile, CreateProfileRequest } from '../models/profile.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private supabase: SupabaseClient;

  constructor(private authService: AuthService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  /**
   * Check if a profile with the same data already exists
   */
  checkProfileExists(profileData: CreateProfileRequest): Observable<UserProfile | null> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return of(null);
    }

    return from(
      this.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('full_name', profileData.full_name)
        .eq('phone', profileData.phone)
        .eq('gender', profileData.gender)
        .eq('email', profileData.email || null)
        .maybeSingle()
    ).pipe(
      map((response) => {
        if (response.error && response.error.code !== 'PGRST116') {
          throw new Error(response.error.message);
        }
        return response.data;
      }),
      catchError((error) => {
        console.error('Error checking profile existence:', error);
        return of(null);
      })
    );
  }

  /**
   * Create a new user profile
   */
  createProfile(profileData: CreateProfileRequest): Observable<UserProfile> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be logged in to create profile');
    }

    // First check if profile already exists
    return this.checkProfileExists(profileData).pipe(
      switchMap((existingProfile) => {
        if (existingProfile) {
          throw new Error('This profile already exists');
        }

        const profileToCreate = {
          id: crypto.randomUUID(),
          user_id: currentUser.id,
          full_name: profileData.full_name,
          email: profileData.email || null,
          phone: profileData.phone,
          gender: profileData.gender,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        return from(
          this.supabase
            .from('profiles')
            .insert(profileToCreate)
            .select()
            .single()
        ).pipe(
          map((response) => {
            if (response.error) {
              throw new Error(response.error.message);
            }
            return response.data;
          })
        );
      }),
      catchError((error) => {
        console.error('Error creating profile:', error);
        throw error;
      })
    );
  }

  /**
   * Get all profiles for the current user
   */
  getUserProfiles(): Observable<UserProfile[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return of([]);
    }

    return from(
      this.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
    ).pipe(
      map((response) => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        return response.data || [];
      }),
      catchError((error) => {
        console.error('Error fetching user profiles:', error);
        return of([]);
      })
    );
  }

  /**
   * Delete a profile
   */
  deleteProfile(profileId: string): Observable<boolean> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be logged in to delete profile');
    }

    return from(
      this.supabase
        .from('profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', currentUser.id) // Ensure user can only delete their own profiles
    ).pipe(
      map((response) => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        return true;
      }),
      catchError((error) => {
        console.error('Error deleting profile:', error);
        throw error;
      })
    );
  }

  /**
   * Update a profile
   */
  updateProfile(profileId: string, updates: Partial<CreateProfileRequest>): Observable<UserProfile> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be logged in to update profile');
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    return from(
      this.supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profileId)
        .eq('user_id', currentUser.id) // Ensure user can only update their own profiles
        .select()
        .single()
    ).pipe(
      map((response) => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        return response.data;
      }),
      catchError((error) => {
        console.error('Error updating profile:', error);
        throw error;
      })
    );
  }
}
