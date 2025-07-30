import { Component, inject, signal, DestroyRef, computed } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  EmailForgotPasswordService,
  EmailForgotPasswordResponse,
  EmailConfirmPasswordResetResponse,
} from '../../services/email-forgot-password.service';

// ========== CONSTANTS ==========
const OTP_RESEND_COOLDOWN = 60; // seconds

// ========== INTERFACES ==========
interface EmailForgotPasswordState {
  currentStep: 'email' | 'otp' | 'password' | 'complete';
  emailVerification: {
    email: string;
    isEmailValid: boolean;
    isOTPSent: boolean;
    isOTPVerified: boolean;
    otpCode: string;
    isVerifyingOTP: boolean;
    isSendingOTP: boolean;
    otpError: string | null;
    emailError: string | null;
    resendCooldown: number;
    canResend: boolean;
    timestamp: number | null;
  };
  formData: {
    email: string;
    newPassword: string;
    confirmPassword: string;
  };
  isSubmitting: boolean;
  error: string | null;
}

@Component({
  selector: 'app-email-forgot-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule, KeyValuePipe],
  templateUrl: './email-forgot-password-page.component.html',
})
export class EmailForgotPasswordPageComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly emailForgotPasswordService = inject(
    EmailForgotPasswordService
  );

  // ==================== STATE ====================
  emailForgotPasswordState = signal<EmailForgotPasswordState>({
    currentStep: 'email',
    emailVerification: {
      email: '',
      isEmailValid: false,
      isOTPSent: false,
      isOTPVerified: false,
      otpCode: '',
      isVerifyingOTP: false,
      isSendingOTP: false,
      otpError: null,
      emailError: null,
      resendCooldown: 0,
      canResend: true,
      timestamp: null,
    },
    formData: {
      email: '',
      newPassword: '',
      confirmPassword: '',
    },
    isSubmitting: false,
    error: null,
  });

  // ==================== COMPUTED ====================
  passwordValidation = computed(() => {
    const state = this.emailForgotPasswordState();
    const password = state.formData.newPassword;
    const confirmPassword = state.formData.confirmPassword;

    const rules = {
      minLength: {
        isValid: password.length >= 8,
        text: 'At least 8 characters',
      },
      hasUpper: {
        isValid: /[A-Z]/.test(password),
        text: 'One uppercase letter',
      },
      hasLower: {
        isValid: /[a-z]/.test(password),
        text: 'One lowercase letter',
      },
      hasNumber: { isValid: /\d/.test(password), text: 'One number' },
      hasSpecial: {
        isValid: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        text: 'One special character',
      },
      passwordsMatch: {
        isValid: password === confirmPassword && password.length > 0,
        text: 'Passwords match',
      },
    };

    const allValid = Object.values(rules).every((rule) => rule.isValid);

    return {
      rules,
      overall: {
        isValid: allValid,
        canSubmit:
          allValid && password.length > 0 && confirmPassword.length > 0,
      },
    };
  });

  // ==================== EMAIL VALIDATION ====================
  onEmailInput(email: string): void {
    this.emailForgotPasswordState.update((state) => ({
      ...state,
      emailVerification: {
        ...state.emailVerification,
        email,
        isEmailValid: this.emailForgotPasswordService.isValidEmail(email),
        emailError: null,
      },
      formData: {
        ...state.formData,
        email,
      },
    }));
  }

  // ==================== SEND OTP ====================
  sendOTP(): void {
    const state = this.emailForgotPasswordState();
    const email = state.emailVerification.email;

    console.log(
      '📧 EMAIL FORGOT PASSWORD COMPONENT - SEND OTP REQUEST STARTED'
    );
    console.log('📧 Email from state:', email);

    if (!state.emailVerification.isEmailValid) {
      console.log('❌ Email validation failed, aborting OTP send');
      return;
    }

    this.emailForgotPasswordState.update((state) => ({
      ...state,
      emailVerification: {
        ...state.emailVerification,
        isSendingOTP: true,
        otpError: null,
      },
    }));

    this.emailForgotPasswordService
      .requestPasswordReset(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: EmailForgotPasswordResponse) => {
          console.log(
            '✅ EMAIL FORGOT PASSWORD COMPONENT - OTP sent successfully'
          );
          console.log('📦 Send OTP response:', response);

          this.emailForgotPasswordState.update((state) => ({
            ...state,
            emailVerification: {
              ...state.emailVerification,
              isSendingOTP: false,
              isOTPSent: true,
              canResend: false,
              resendCooldown: OTP_RESEND_COOLDOWN,
              timestamp: response.timestamp || Date.now(),
            },
            currentStep: 'otp',
          }));

          this.startResendTimer();
        },
        error: (error) => {
          console.log(
            '❌ EMAIL FORGOT PASSWORD COMPONENT - Failed to send OTP'
          );
          console.log('📦 Send OTP error:', error);

          let errorMessage = 'Failed to send verification code';
          if (error.status === 404) {
            errorMessage = 'Email address not found. Please check your email.';
          } else if (error.status === 400) {
            errorMessage = error.message || 'Invalid email address format';
          }

          this.emailForgotPasswordState.update((state) => ({
            ...state,
            emailVerification: {
              ...state.emailVerification,
              isSendingOTP: false,
              otpError: errorMessage,
            },
          }));
        },
      });
  }

  // ==================== OTP INPUT ====================
  onOTPInput(otp: string): void {
    this.emailForgotPasswordState.update((state) => ({
      ...state,
      emailVerification: {
        ...state.emailVerification,
        otpCode: otp,
        otpError: null,
      },
    }));
  }

  // ==================== VERIFY OTP ====================
  verifyOTP(): void {
    const state = this.emailForgotPasswordState();
    const otp = state.emailVerification.otpCode;

    console.log('🔢 EMAIL FORGOT PASSWORD COMPONENT - VERIFY OTP STARTED');
    console.log('🔢 OTP to verify:', otp);

    if (!state.emailVerification.isOTPSent) return;

    if (!this.emailForgotPasswordService.isValidOTP(otp)) {
      this.emailForgotPasswordState.update((state) => ({
        ...state,
        emailVerification: {
          ...state.emailVerification,
          otpError: 'Please enter a valid 6-digit OTP',
        },
      }));
      return;
    }

    this.emailForgotPasswordState.update((state) => ({
      ...state,
      emailVerification: {
        ...state.emailVerification,
        isVerifyingOTP: true,
        otpError: null,
      },
    }));

    // Move to password step after brief delay
    setTimeout(() => {
      this.emailForgotPasswordState.update((state) => ({
        ...state,
        emailVerification: {
          ...state.emailVerification,
          isVerifyingOTP: false,
          isOTPVerified: true,
          otpError: null,
        },
        currentStep: 'password',
      }));
    }, 1000);
  }

  // ==================== RESET PASSWORD ====================
  resetPassword(): void {
    const state = this.emailForgotPasswordState();

    console.log('🎯 EMAIL FORGOT PASSWORD COMPONENT - RESET PASSWORD STARTED');

    if (!state.emailVerification.isOTPVerified) {
      console.log('❌ OTP not verified, aborting password reset');
      return;
    }

    if (!this.passwordValidation()?.overall?.canSubmit) {
      console.log('❌ Password validation failed, aborting password reset');
      return;
    }

    if (!state.emailVerification.timestamp) {
      console.log('❌ No timestamp available, aborting password reset');
      return;
    }

    this.emailForgotPasswordState.update((state) => ({
      ...state,
      isSubmitting: true,
      error: null,
    }));

    const email = state.formData.email;
    const newPassword = state.formData.newPassword;
    const otp = state.emailVerification.otpCode;
    const timestamp = state.emailVerification.timestamp;

    this.emailForgotPasswordService
      .confirmPasswordReset(email, otp, newPassword, timestamp)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: EmailConfirmPasswordResetResponse) => {
          console.log(
            '✅ EMAIL FORGOT PASSWORD COMPONENT - Password reset successful'
          );
          console.log('📦 Reset password response:', response);

          this.emailForgotPasswordState.update((state) => ({
            ...state,
            isSubmitting: false,
            currentStep: 'complete',
          }));

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error) => {
          console.log(
            '❌ EMAIL FORGOT PASSWORD COMPONENT - Password reset failed'
          );
          console.log('📦 Reset password error:', error);

          let errorMessage = 'Password reset failed. Please try again.';

          if (error.status === 401) {
            errorMessage = 'Invalid or expired verification code';
          } else if (error.status === 400) {
            errorMessage =
              error.message ||
              'Invalid request. Please check your information.';
          } else if (error.status === 404) {
            errorMessage = 'User not found. Please check your email address.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }

          this.emailForgotPasswordState.update((state) => ({
            ...state,
            isSubmitting: false,
            error: errorMessage,
          }));
        },
      });
  }

  // ==================== RESEND OTP ====================
  resendOTP(): void {
    const state = this.emailForgotPasswordState();
    if (!state.emailVerification.canResend) return;
    this.sendOTP();
  }

  // ==================== TIMER ====================
  private startResendTimer(): void {
    const timer = setInterval(() => {
      this.emailForgotPasswordState.update((state) => {
        const newCooldown = state.emailVerification.resendCooldown - 1;

        if (newCooldown <= 0) {
          clearInterval(timer);
          return {
            ...state,
            emailVerification: {
              ...state.emailVerification,
              resendCooldown: 0,
              canResend: true,
            },
          };
        }

        return {
          ...state,
          emailVerification: {
            ...state.emailVerification,
            resendCooldown: newCooldown,
          },
        };
      });
    }, 1000);
  }

  // ==================== PASSWORD INPUT ====================
  onPasswordInput(password: string): void {
    this.emailForgotPasswordState.update((state) => ({
      ...state,
      formData: {
        ...state.formData,
        newPassword: password,
      },
    }));
  }

  onConfirmPasswordInput(confirmPassword: string): void {
    this.emailForgotPasswordState.update((state) => ({
      ...state,
      formData: {
        ...state.formData,
        confirmPassword: confirmPassword,
      },
    }));
  }

  // ==================== NAVIGATION ====================
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
