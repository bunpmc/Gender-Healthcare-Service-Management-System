import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { createClient } from '@supabase/supabase-js';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"
        ></div>
        <p class="text-lg text-gray-600">Processing authentication...</p>
      </div>
    </div>
  `,
})
export class AuthCallbackComponent implements OnInit {
  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  constructor(private router: Router, private http: HttpClient) {}

  async ngOnInit(): Promise<void> {
    try {
      // Handle Supabase OAuth callback
      await this.handleSupabaseCallback();
    } catch (error) {
      console.error('Auth callback error:', error);
      this.router.navigate(['/']);
    }
  }

  private async handleSupabaseCallback(): Promise<void> {
    // Get the current URL
    const currentUrl = window.location.href;
    console.log('Current callback URL:', currentUrl);

    // Check for hash parameters (OAuth implicit flow)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);

    // Check for search parameters (OAuth code flow)
    const searchParams = new URLSearchParams(window.location.search);

    // Try to get access token from either hash or search params
    let accessToken =
      hashParams.get('access_token') || searchParams.get('access_token');
    let refreshToken =
      hashParams.get('refresh_token') || searchParams.get('refresh_token');

    if (accessToken) {
      console.log('Access token found, processing authentication...');

      // Store tokens
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }

      // Set session in Supabase
      const { data, error } = await this.supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      if (error) {
        console.error('Error setting Supabase session:', error);
        throw error;
      }

      if (data.user) {
        console.log('User authenticated successfully:', data.user.email);
        localStorage.setItem('current_user', JSON.stringify(data.user));

        // Redirect to home page
        this.router.navigate(['/']);
      } else {
        throw new Error('No user data received');
      }
    } else {
      // Try to get session from current URL
      const { data, error } = await this.supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        throw error;
      }

      if (data.session) {
        console.log('Session retrieved successfully');
        localStorage.setItem('access_token', data.session.access_token);
        localStorage.setItem('current_user', JSON.stringify(data.session.user));
        this.router.navigate(['/']);
      } else {
        console.error('No access token found in URL');
        throw new Error('No authentication data found');
      }
    }
  }
}
