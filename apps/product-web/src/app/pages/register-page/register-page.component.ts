// ==================== IMPORTS ====================
import {
  afterNextRender,
  Component,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { environment } from '../../environments/environment';
import { FormsModule, NgForm } from '@angular/forms';
import { debounceTime, interval } from 'rxjs';
import { GoogleComponent } from '../../components/google/google.component';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import {
  OtpService,
  RegisterResponse,
  VerifyOTPResponse,
} from '../../services/otp.service';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  validatePhoneNumber,
  validateOTP,
  REGISTRATION_STEPS,
  OTP_RESEND_COOLDOWN,
} from '../../models/registration.model';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

// ==================== COMPONENT ====================
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, TranslateModule, GoogleComponent],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.css',
})
export class RegisterComponent {
  showPass = false;
  showConfirmPass = false;
  errorMsg = '';
  passwordValidation: any = null;
  showPasswordStrength = false;

  registrationState = signal({
    currentStep: 'phone' as 'phone' | 'otp' | 'password' | 'complete',
    phoneVerification: {
      phone: '',
      isPhoneValid: false,
      isOTPSent: false,
      isOTPVerified: false,
      otpCode: '',
      isVerifyingOTP: false,
      isSendingOTP: false,
      otpError: null as string | null,
      phoneError: null as string | null,
      resendCooldown: 0,
      canResend: true,
    },
    formData: {
      phone: '',
      password: '',
      confirmPassword: '',
    },
    isSubmitting: false,
    error: null as string | null,
  });

  private form = viewChild.required<NgForm>('form');
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private otpService = inject(OtpService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  readonly REGISTRATION_STEPS = REGISTRATION_STEPS;

  constructor() {
    afterNextRender(() => {
      const savedForm = window.localStorage.getItem('save-register-form');
      if (savedForm) {
        const loaded = JSON.parse(savedForm);
        Promise.resolve().then(() => {
          if (this.form().controls['phone'] && loaded.phone) {
            this.form().controls['phone'].setValue(loaded.phone);
            this.onPhoneInput(loaded.phone);
          }
        });
      }

      const subscription = this.form()
        .valueChanges?.pipe(debounceTime(500))
        .subscribe((value) => {
          window.localStorage.setItem(
            'save-register-form',
            JSON.stringify({
              phone: value.phone,
              otpCode: value.otpCode,
              password: value.password,
              confirmPassword: value.confirmPassword,
            })
          );
        });

      this.destroyRef.onDestroy(() => subscription?.unsubscribe());
    });
  }

  // ==================== GOOGLE SIGN IN ====================
  signInWithGoogle(): void {
    this.registrationState.update((s) => ({ ...s, isSubmitting: true }));
    supabase.auth
      .signInWithOAuth({ provider: 'google' })
      .then(({ data, error }) => {
        this.registrationState.update((s) => ({ ...s, isSubmitting: false }));
        if (error) {
          this.errorMsg = 'Google login failed. Please try again.';
          console.error(error);
        } else {
          console.log('Redirecting to Google login...', data);
        }
      });
  }

  // ==================== PHONE REGISTER ====================
  onPhoneInput(phone: string): void {
    const val = validatePhoneNumber(phone);
    this.registrationState.update((s) => ({
      ...s,
      phoneVerification: {
        ...s.phoneVerification,
        phone,
        isPhoneValid: val.isValid,
        phoneError: val.error,
      },
      formData: { ...s.formData, phone },
    }));
    this.errorMsg = '';
    if (val.isValid) localStorage.setItem('registration-phone', phone);
  }

  sendOTP(): void {
    const state = this.registrationState();
    if (!state.phoneVerification.isPhoneValid) return;

    this.registrationState.update((s) => ({
      ...s,
      phoneVerification: {
        ...s.phoneVerification,
        isSendingOTP: true,
        otpError: null,
      },
    }));

    this.otpService.sendOTP(state.phoneVerification.phone).subscribe({
      next: (res: RegisterResponse) => {
        this.registrationState.update((s) => ({
          ...s,
          phoneVerification: {
            ...s.phoneVerification,
            isSendingOTP: false,
            isOTPSent: true,
            canResend: false,
            resendCooldown: OTP_RESEND_COOLDOWN,
          },
          currentStep: 'otp',
        }));
        this.startResendTimer();
      },
      error: (err) => {
        this.registrationState.update((s) => ({
          ...s,
          phoneVerification: {
            ...s.phoneVerification,
            isSendingOTP: false,
            otpError: err.message || 'Failed to send OTP',
          },
        }));
      },
    });
  }

  onOTPInput(otp: string): void {
    const clean = otp.replace(/\D/g, '').substring(0, 6);
    const val = validateOTP(clean);
    this.registrationState.update((s) => ({
      ...s,
      phoneVerification: {
        ...s.phoneVerification,
        otpCode: clean,
        otpError: val.error,
      },
    }));
    this.errorMsg = val.error || '';
  }

  verifyOTP(): void {
    const state = this.registrationState();
    if (!state.phoneVerification.isOTPSent) return;

    const val = validateOTP(state.phoneVerification.otpCode);
    if (!val.isValid) {
      this.registrationState.update((s) => ({
        ...s,
        phoneVerification: { ...s.phoneVerification, otpError: val.error },
      }));
      return;
    }

    this.registrationState.update((s) => ({
      ...s,
      phoneVerification: { ...s.phoneVerification, isVerifyingOTP: true },
    }));

    setTimeout(() => {
      this.registrationState.update((s) => ({
        ...s,
        phoneVerification: {
          ...s.phoneVerification,
          isVerifyingOTP: false,
          isOTPVerified: true,
        },
        currentStep: 'password',
      }));
    }, 1000);
  }

  resendOTP(): void {
    if (this.registrationState().phoneVerification.canResend) this.sendOTP();
  }

  private startResendTimer(): void {
    const sub = interval(1000).subscribe(() => {
      this.registrationState.update((s) => {
        const newCooldown = s.phoneVerification.resendCooldown - 1;
        if (newCooldown <= 0) {
          sub.unsubscribe();
          return {
            ...s,
            phoneVerification: {
              ...s.phoneVerification,
              resendCooldown: 0,
              canResend: true,
            },
          };
        }
        return {
          ...s,
          phoneVerification: {
            ...s.phoneVerification,
            resendCooldown: newCooldown,
          },
        };
      });
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  // ==================== PASSWORD ====================
  onPasswordInput(password: string): void {
    this.registrationState.update((s) => ({
      ...s,
      formData: { ...s.formData, password },
    }));
    this.showPasswordStrength = password.length > 0;
    this.validatePasswords();
  }

  onConfirmPasswordInput(confirmPassword: string): void {
    this.registrationState.update((s) => ({
      ...s,
      formData: { ...s.formData, confirmPassword },
    }));
    this.validatePasswords();
  }

  private validatePasswords(): void {
    const { password, confirmPassword } = this.registrationState().formData;
    if (password || confirmPassword) {
      const min = password.length >= 8;
      const num = /\d/.test(password);
      const special = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      const match = password === confirmPassword;

      this.passwordValidation = {
        password: {
          strength: min && num && special ? 'strong' : 'weak',
          rules: [
            { text: 'At least 8 characters', isValid: min },
            { text: 'Contains a number', isValid: num },
            { text: 'Contains a special character', isValid: special },
          ],
        },
        confirmPassword: {
          isValid: match,
          error: match ? null : 'Passwords do not match',
        },
        overall: {
          canSubmit: min && num && special && match,
        },
      };
    } else {
      this.passwordValidation = null;
    }
  }

  completeRegistration(): void {
    const state = this.registrationState();
    if (!state.phoneVerification.isOTPVerified) return;
    if (!this.passwordValidation?.overall?.canSubmit) return;

    this.registrationState.update((s) => ({ ...s, isSubmitting: true }));

    this.otpService
      .verifyOTPAndRegister(
        state.formData.phone,
        state.phoneVerification.otpCode,
        state.formData.password
      )
      .subscribe({
        next: (res: VerifyOTPResponse) => {
          if (res.data?.access_token) {
            this.tokenService.setTokenSession(res.data.access_token);

            // Also save user data if available
            if (res.data.user) {
              const userData = {
                id: res.data.user.id,
                phone: res.data.user.phone || state.formData.phone,
                email: (res.data.user as any).email || '',
                name: (res.data.user as any).full_name || 'Phone User',
                authenticated_at: new Date().toISOString(),
                patient_profile: {
                  id: res.data.user.id,
                  full_name: (res.data.user as any).full_name || 'Phone User',
                  phone: res.data.user.phone || state.formData.phone,
                  email: (res.data.user as any).email || '',
                  patient_status: 'active',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              };
              localStorage.setItem('current_user', JSON.stringify(userData));
              console.log(
                '✅ User data saved to localStorage after registration'
              );
            }
          }
          this.registrationState.update((s) => ({
            ...s,
            isSubmitting: false,
            currentStep: 'complete',
          }));
          localStorage.removeItem('registration-phone');
          setTimeout(() => this.router.navigate(['/']), 2000);
        },
        error: (err) => {
          this.registrationState.update((s) => ({
            ...s,
            isSubmitting: false,
            error: err.message || 'Registration failed',
          }));
        },
      });
  }

  // ==================== UTILITIES ====================
  getStepProgress() {
    const current = this.registrationState().currentStep;
    const order = REGISTRATION_STEPS[current].order;
    const total = Object.keys(REGISTRATION_STEPS).length - 1;
    return {
      current: order,
      total,
      percentage: Math.round((order / total) * 100),
    };
  }

  goBackStep(): void {
    const current = this.registrationState().currentStep;
    if (current === 'otp') {
      this.registrationState.update((s) => ({
        ...s,
        currentStep: 'phone',
        phoneVerification: {
          ...s.phoneVerification,
          isOTPSent: false,
          otpCode: '',
          otpError: null,
        },
      }));
    } else if (current === 'password') {
      this.registrationState.update((s) => ({
        ...s,
        currentStep: 'otp',
      }));
    }
  }

  formatPhoneForDisplay(phone: string): string {
    return phone.replace(/(\d{3})(\d{3})(\d{3,})/, '+84 $1 $2 $3');
  }

  formatOTPForDisplay(otp: string): string {
    return otp.replace(/(\d{3})(\d{3})/, '$1 $2');
  }

  getPasswordStrengthColor(): string {
    if (!this.passwordValidation?.password) return '#e5e7eb';
    return this.passwordValidation.password.strength === 'strong'
      ? '#10b981'
      : '#f59e0b';
  }

  getPasswordStrengthText(): string {
    if (!this.passwordValidation?.password) return '';
    return this.passwordValidation.password.strength === 'strong'
      ? 'Strong'
      : 'Weak';
  }

  shouldShowPasswordValidation(): boolean {
    return this.showPasswordStrength && this.passwordValidation !== null;
  }
}
