import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// ========== INTERFACES ==========

export interface ForgotPasswordRequest {
  phone: string;
}

export interface ResetPasswordRequest {
  phone: string;
  otp_code: string;
  new_password: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  data: {
    phone: string;
  };
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  data: {
    phone: string;
  };
}

export interface ForgotPasswordErrorResponse {
  error: string;
  details?: string;
}

// ========== SERVICE ==========

@Injectable({
  providedIn: 'root'
})
export class ForgotPasswordService {
  private readonly FORGOT_PASSWORD_API_URL = 'https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1/forgot-password-request';
  private readonly RESET_PASSWORD_API_URL = 'https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1/reset-password';

  constructor(private http: HttpClient) {}

  /**
   * Convert Vietnamese phone number to E.164 format
   */
  private convertToE164(phone: string): string {
    // Remove any spaces or formatting
    const cleanPhone = phone.replace(/\s/g, '');
    
    // If it starts with 0, replace with +84
    if (cleanPhone.startsWith('0')) {
      return '+84' + cleanPhone.substring(1);
    }
    
    // If it already starts with +84, return as is
    if (cleanPhone.startsWith('+84')) {
      return cleanPhone;
    }
    
    // If it starts with 84, add +
    if (cleanPhone.startsWith('84')) {
      return '+' + cleanPhone;
    }
    
    // Default: assume it's a Vietnamese number without country code
    return '+84' + cleanPhone;
  }

  /**
   * Request password reset OTP
   */
  requestPasswordReset(phone: string): Observable<ForgotPasswordResponse> {
    console.log('📱 FORGOT PASSWORD SERVICE - REQUEST PASSWORD RESET STARTED');
    console.log('📱 Original phone input:', phone);
    
    // Convert Vietnamese phone format to E.164 format
    const e164Phone = this.convertToE164(phone);
    console.log('📱 Converted to E.164 format:', e164Phone);
    
    const payload: ForgotPasswordRequest = {
      phone: e164Phone
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    console.log('🌐 Forgot password endpoint:', this.FORGOT_PASSWORD_API_URL);
    console.log('📦 Request body:', JSON.stringify(payload, null, 2));
    console.log('📋 Request headers:', headers);

    return this.http
      .post<ForgotPasswordResponse>(this.FORGOT_PASSWORD_API_URL, payload, { headers })
      .pipe(
        tap({
          next: (response) => {
            console.log('✅ FORGOT PASSWORD REQUEST SUCCESS - Response received:', response);
            console.log('📱 Phone confirmed:', response.data?.phone);
            console.log('📝 Message:', response.message);
            console.log('✅ Success status:', response.success);
          },
          error: (error) => {
            console.log('❌ FORGOT PASSWORD REQUEST ERROR - Error details:');
            console.log('Status:', error.status);
            console.log('Status Text:', error.statusText);
            console.log('Error Body:', error.error);
            console.log('Full Error Object:', error);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Reset password with OTP verification
   */
  resetPassword(phone: string, otp: string, newPassword: string): Observable<ResetPasswordResponse> {
    console.log('🔐 FORGOT PASSWORD SERVICE - RESET PASSWORD STARTED');
    console.log('📱 Original phone input:', phone);
    console.log('🔢 OTP code:', otp);
    console.log('🔒 New password length:', newPassword.length);
    console.log('🔒 New password starts with:', newPassword.substring(0, 2) + '***');
    
    // Convert Vietnamese phone format to E.164 format
    const e164Phone = this.convertToE164(phone);
    console.log('📱 Converted to E.164 format:', e164Phone);

    const payload: ResetPasswordRequest = {
      phone: e164Phone,
      otp_code: otp,
      new_password: newPassword,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    console.log('🌐 Reset password endpoint:', this.RESET_PASSWORD_API_URL);
    console.log('📦 Reset password request body:', JSON.stringify({
      phone: payload.phone,
      otp_code: payload.otp_code,
      new_password: '***' + payload.new_password.substring(payload.new_password.length - 2)
    }, null, 2));
    console.log('📋 Reset password request headers:', headers);

    return this.http
      .post<ResetPasswordResponse>(this.RESET_PASSWORD_API_URL, payload, { headers })
      .pipe(
        tap({
          next: (response) => {
            console.log('✅ RESET PASSWORD SUCCESS - Response received:', response);
            console.log('📱 Phone confirmed:', response.data?.phone);
            console.log('📝 Message:', response.message);
            console.log('✅ Success status:', response.success);
          },
          error: (error) => {
            console.log('❌ RESET PASSWORD ERROR - Error details:');
            console.log('Status:', error.status);
            console.log('Status Text:', error.statusText);
            console.log('Error Body:', error.error);
            console.log('Full Error Object:', error);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Validate phone number format (Vietnamese format)
   */
  isValidPhoneNumber(phone: string): boolean {
    // Vietnamese phone number pattern: starts with 0, followed by 9 digits
    const phonePattern = /^0\d{9}$/;
    return phonePattern.test(phone);
  }

  /**
   * Validate OTP format
   */
  isValidOTP(otp: string): boolean {
    // OTP should be exactly 6 digits
    const otpPattern = /^\d{6}$/;
    return otpPattern.test(otp);
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: any): Observable<never> => {
    console.error('HTTP Error occurred:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error && error.error.error) {
      errorMessage = error.error.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => ({
      ...error,
      message: errorMessage
    }));
  };
}
