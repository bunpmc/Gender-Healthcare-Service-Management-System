import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import {
    StaffMember,
    Appointment,
    Patient,
    StaffRole,
    StaffStatus,
    GenderEnum,
    VisitTypeEnum,
    ProcessStatus,
    ScheduleEnum
} from '../models/database.interface';

export interface CreateStaffRequest {
    full_name: string;
    working_email: string;
    role: StaffRole;
    years_experience?: number;
    hired_at?: string;
    is_available?: boolean;
    staff_status?: StaffStatus;
    gender?: GenderEnum;
    languages?: string[];
    image_link?: string;
}

export interface CreateAppointmentRequest {
    patient_id?: string;
    phone: string;
    email: string;
    visit_type: VisitTypeEnum;
    schedule: ScheduleEnum;
    message?: string;
    doctor_id?: string;
    category_id?: string;
    preferred_date?: string;
    preferred_time?: string;
    // Guest information if patient_id is not provided
    guest_full_name?: string;
    guest_date_of_birth?: string;
    guest_gender?: GenderEnum;
    guest_emergency_contact?: string;
    guest_address?: string;
}

export interface EdgeFunctionResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class EdgeFunctionService {
    private readonly BASE_URL = 'https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1';

    constructor() { }

    /**
     * Create staff member using edge function
     */
    createStaffMember(staffData: CreateStaffRequest): Observable<EdgeFunctionResponse<StaffMember>> {
        return from(this.callEdgeFunction<StaffMember>('create-staff', staffData));
    }

    /**
     * Create appointment using edge function
     */
    createAppointment(appointmentData: CreateAppointmentRequest): Observable<EdgeFunctionResponse<Appointment>> {
        return from(this.callEdgeFunction<Appointment>('create-appointment', appointmentData));
    }

    /**
     * Login user
     */
    loginUser(credentials: { email: string; password: string }): Observable<EdgeFunctionResponse<any>> {
        return from(this.callEdgeFunction('login', credentials));
    }

    /**
     * Register user
     */
    registerUser(userData: {
        email: string;
        password: string;
        full_name: string;
        phone?: string;
        date_of_birth?: string;
        gender?: GenderEnum;
    }): Observable<EdgeFunctionResponse<any>> {
        return from(this.callEdgeFunction('register', userData));
    }

    /**
     * Forgot password
     */
    forgotPassword(email: string): Observable<EdgeFunctionResponse<any>> {
        return from(this.callEdgeFunction('forget-password', { email }));
    }

    /**
     * Reset password
     */
    resetPassword(data: {
        token: string;
        new_password: string
    }): Observable<EdgeFunctionResponse<any>> {
        return from(this.callEdgeFunction('confirm-password-reset', data));
    }

    /**
     * Request password reset
     */
    requestPasswordReset(email: string): Observable<EdgeFunctionResponse<any>> {
        return from(this.callEdgeFunction('request-password-reset', { email }));
    }

    /**
     * Send OTP via email
     */
    sendOtpEmail(email: string): Observable<EdgeFunctionResponse<any>> {
        return from(this.callEdgeFunction('otp-auth-gmail', { email }));
    }

    /**
     * Verify OTP
     */
    verifyOtp(data: {
        email: string;
        otp: string
    }): Observable<EdgeFunctionResponse<any>> {
        return from(this.callEdgeFunction('verify-otp', data));
    }

    /**
     * Verify mail OTP
     */
    verifyMailOtp(data: {
        email: string;
        otp: string
    }): Observable<EdgeFunctionResponse<any>> {
        return from(this.callEdgeFunction('verify-mailotp', data));
    }

    /**
     * Get user profile
     */
    getUserProfile(): Observable<EdgeFunctionResponse<any>> {
        return from(this.callEdgeFunction('me', {}, 'GET'));
    }

    /**
     * Google authentication
     */
    googleAuth(data: { token: string }): Observable<EdgeFunctionResponse<any>> {
        return from(this.callEdgeFunction('google-auth', data));
    }

    /**
     * Create VNPay payment
     */
    createVnpayPayment(data: {
        amount: number;
        order_info: string;
        appointment_id?: string;
        return_url?: string;
    }): Observable<EdgeFunctionResponse<any>> {
        return from(this.callEdgeFunction('vnpay-payment', data));
    }

    /**
     * Handle VNPay callback
     */
    handleVnpayCallback(callbackData: any): Observable<EdgeFunctionResponse<any>> {
        return from(this.callEdgeFunction('vnpay-callback', callbackData));
    }

    /**
     * Auto cancel transaction
     */
    autoCancelTransaction(transactionId: string): Observable<EdgeFunctionResponse<any>> {
        return from(this.callEdgeFunction('auto-cancel-transaction', { transaction_id: transactionId }));
    }

    /**
     * Generic method to call edge functions
     */
    private async callEdgeFunction<T>(
        functionName: string,
        data: any = {},
        method: 'POST' | 'GET' = 'POST'
    ): Promise<EdgeFunctionResponse<T>> {
        try {
            console.log(`🚀 Calling edge function: ${functionName}`);
            console.log('📝 Request data:', data);

            const url = `${this.BASE_URL}/${functionName}`;

            const requestOptions: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            };

            if (method === 'POST' && data) {
                requestOptions.body = JSON.stringify(data);
            }

            // Get auth token if available
            const token = this.getAuthToken();
            if (token) {
                requestOptions.headers = {
                    ...requestOptions.headers,
                    'Authorization': `Bearer ${token}`
                };
            }

            console.log('📡 Making request to:', url);
            console.log('📤 Request options:', requestOptions);

            const response = await fetch(url, requestOptions);

            console.log('📥 Response status:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Edge function error:', errorText);

                try {
                    const errorJson = JSON.parse(errorText);
                    return {
                        success: false,
                        error: errorJson.error || `HTTP ${response.status}: ${response.statusText}`,
                        data: errorJson.details || null
                    };
                } catch {
                    return {
                        success: false,
                        error: `HTTP ${response.status}: ${response.statusText}`,
                        data: undefined
                    };
                }
            }

            const result = await response.json();
            console.log('✅ Edge function success:', result);

            return {
                success: true,
                data: result.data || result,
                message: result.message
            };

        } catch (error) {
            console.error('💥 Edge function call failed:', error);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                data: undefined
            };
        }
    }

    /**
     * Get authentication token from localStorage or sessionStorage
     */
    private getAuthToken(): string | null {
        try {
            // Try to get from localStorage first
            const localToken = localStorage.getItem('supabase.auth.token');
            if (localToken) {
                const parsed = JSON.parse(localToken);
                return parsed.access_token;
            }

            // Try sessionStorage
            const sessionToken = sessionStorage.getItem('supabase.auth.token');
            if (sessionToken) {
                const parsed = JSON.parse(sessionToken);
                return parsed.access_token;
            }

            return null;
        } catch (error) {
            console.warn('Failed to get auth token:', error);
            return null;
        }
    }

    /**
     * Set authentication token
     */
    setAuthToken(token: string): void {
        try {
            const tokenData = { access_token: token };
            localStorage.setItem('supabase.auth.token', JSON.stringify(tokenData));
        } catch (error) {
            console.error('Failed to set auth token:', error);
        }
    }

    /**
     * Clear authentication token
     */
    clearAuthToken(): void {
        try {
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.removeItem('supabase.auth.token');
        } catch (error) {
            console.error('Failed to clear auth token:', error);
        }
    }
}
