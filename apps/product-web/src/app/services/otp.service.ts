import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// ========== INTERFACES ==========

export interface RegisterRequest {
  phone: string;
}

export interface VerifyOTPRequest {
  phone: string;
  otp_code: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    phone: string;
  };
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  data: {
    patient_id: string;
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    user: {
      id: string;
      phone: string;
      phone_confirmed_at: string;
    };
    patient: {
      patient_id: string;
      full_name: string;
      gender: string;
      status: string;
    };
  };
}

export interface OTPErrorResponse {
  error: string;
  details?: string;
}

// ========== SERVICE ==========

@Injectable({
  providedIn: 'root',
})
export class OtpService {
  private readonly REGISTER_API_URL =
    'https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1/register';
  private readonly VERIFY_OTP_API_URL =
    'https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1/verify-otp';

  constructor(private http: HttpClient) {}

  /**
   * Send OTP to phone number (register endpoint)
   */
  sendOTP(phone: string): Observable<RegisterResponse> {
    console.log('📱 OTP SERVICE - SEND OTP REQUEST STARTED');
    console.log('📱 Original phone input:', phone);

    // Convert Vietnamese phone format to E.164 format
    const e164Phone = this.convertToE164(phone);
    console.log('📱 Converted to E.164 format:', e164Phone);

    const payload: RegisterRequest = {
      phone: e164Phone,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    console.log('🌐 Send OTP endpoint:', this.REGISTER_API_URL);
    console.log('📦 Send OTP request body:', JSON.stringify(payload, null, 2));
    console.log('📋 Send OTP request headers:', headers);

    return this.http
      .post<RegisterResponse>(this.REGISTER_API_URL, payload, { headers })
      .pipe(
        tap({
          next: (response) => {
            console.log('✅ SEND OTP SUCCESS - Response received:', response);
            console.log('📱 Phone confirmed:', response.data?.phone);
            console.log('📝 Message:', response.message);
            console.log('✅ Success status:', response.success);
          },
          error: (error) => {
            console.log('❌ SEND OTP ERROR - Error details:');
            console.log('Status:', error.status);
            console.log('Status Text:', error.statusText);
            console.log('Error Body:', error.error);
            console.log('Full Error Object:', error);
          },
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Verify OTP and complete registration
   */
  verifyOTPAndRegister(
    phone: string,
    otp: string,
    password: string
  ): Observable<VerifyOTPResponse> {
    console.log('🔐 OTP SERVICE - VERIFY OTP AND REGISTER REQUEST STARTED');
    console.log('📱 Original phone input:', phone);
    console.log('🔢 OTP token:', otp);
    console.log('🔒 Password length:', password.length);
    console.log('🔒 Password starts with:', password.substring(0, 2) + '***');

    // Convert Vietnamese phone format to E.164 format
    const e164Phone = this.convertToE164(phone);
    console.log('📱 Converted to E.164 format:', e164Phone);

    const payload: VerifyOTPRequest = {
      phone: e164Phone,
      otp_code: otp,
      password: password,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    console.log('🌐 Verify OTP endpoint:', this.VERIFY_OTP_API_URL);
    console.log(
      '📦 Verify OTP request body:',
      JSON.stringify(
        {
          phone: payload.phone,
          otp_code: payload.otp_code,
          password:
            '***' + payload.password.substring(payload.password.length - 2),
        },
        null,
        2
      )
    );
    console.log('📋 Verify OTP request headers:', headers);

    return this.http
      .post<VerifyOTPResponse>(this.VERIFY_OTP_API_URL, payload, { headers })
      .pipe(
        tap({
          next: (response) => {
            console.log('✅ VERIFY OTP SUCCESS - Response received:', response);
            console.log(
              '🎫 Access token received:',
              response.data?.access_token
                ? response.data.access_token.substring(0, 20) + '...'
                : 'null'
            );
            console.log('👤 User created with ID:', response.data?.user?.id);
            console.log(
              '🏥 Patient profile created:',
              response.data?.patient?.patient_id
            );
          },
          error: (error) => {
            console.log('❌ VERIFY OTP ERROR - Error details:');
            console.log('Status:', error.status);
            console.log('Status Text:', error.statusText);
            console.log('Error Body:', error.error);
            console.log('Full Error Object:', error);
          },
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.error) {
        errorMessage = error.error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => ({
      status: error.status || 500,
      message: errorMessage,
      details: error.error?.details || null,
    }));
  }

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
   * Validate phone number format (Vietnamese format)
   */
  isValidPhoneNumber(phone: string): boolean {
    // Vietnamese phone number pattern: starts with 0, followed by 9 digits
    const phonePattern = /^0\d{9}$/;
    return phonePattern.test(phone);
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phone: string): string {
    if (!phone || phone.length !== 10) return phone;

    // Format: 0123 456 789
    return `${phone.substring(0, 4)} ${phone.substring(4, 7)} ${phone.substring(
      7
    )}`;
  }

  /**
   * Validate OTP format
   */
  isValidOTP(otp: string): boolean {
    // OTP should be exactly 6 digits
    const otpPattern = /^\d{6}$/;
    return otpPattern.test(otp);
  }
}
