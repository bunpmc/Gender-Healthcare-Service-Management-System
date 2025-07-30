import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { interval } from 'rxjs';
import {
  ForgotPasswordService,
  ForgotPasswordResponse,
  ResetPasswordResponse,
} from '../../services/forgot-password.service';

// ========== CONSTANTS ==========
const OTP_RESEND_COOLDOWN = 60; // seconds

// ========== INTERFACES ==========
interface ForgotPasswordState {
  currentStep: 'phone' | 'otp' | 'password' | 'complete';
  phoneVerification: {
    phone: string;
    isPhoneValid: boolean;
    isOTPSent: boolean;
    isOTPVerified: boolean;
    otpCode: string;
    isVerifyingOTP: boolean;
    isSendingOTP: boolean;
    otpError: string | null;
    phoneError: string | null;
    resendCooldown: number;
    canResend: boolean;
  };
  formData: {
    phone: string;
    newPassword: string;
    confirmPassword: string;
  };
  isSubmitting: boolean;
  error: string | null;
}

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password-page.component.html',
  styleUrls: ['./forgot-password-page.component.scss'],
})
export class ForgotPasswordPageComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly forgotPasswordService = inject(ForgotPasswordService);

  // ==================== STATE ====================
  forgotPasswordState = signal<ForgotPasswordState>({
    currentStep: 'phone',
    phoneVerification: {
      phone: '',
      isPhoneValid: false,
      isOTPSent: false,
      isOTPVerified: false,
      otpCode: '',
      isVerifyingOTP: false,
      isSendingOTP: false,
      otpError: null,
      phoneError: null,
      resendCooldown: 0,
      canResend: true,
    },
    formData: {
      phone: '',
      newPassword: '',
      confirmPassword: '',
    },
    isSubmitting: false,
    error: null,
  });

  // ==================== PASSWORD VALIDATION ====================
  passwordValidation: any = null;
  showPasswordStrength = false;

  // ==================== LIFECYCLE ====================
  ngOnInit() {
    console.log('🔄 FORGOT PASSWORD COMPONENT - Initialized');
  }

  // ==================== PHONE INPUT ====================
  onPhoneInput(phone: string): void {
    console.log('📱 FORGOT PASSWORD COMPONENT - Phone input changed');
    console.log('📱 New phone value:', phone);

    const isValid = this.forgotPasswordService.isValidPhoneNumber(phone);
    console.log('✅ Phone validation result:', isValid);

    this.forgotPasswordState.update((state) => ({
      ...state,
      phoneVerification: {
        ...state.phoneVerification,
        phone: phone,
        isPhoneValid: isValid,
        phoneError: isValid
          ? null
          : 'Please enter a valid Vietnamese phone number',
      },
      formData: {
        ...state.formData,
        phone: phone,
      },
    }));
  }

  // ==================== SEND OTP ====================
  sendOTP(): void {
    const state = this.forgotPasswordState();
    const phone = state.phoneVerification.phone;

    console.log('📱 FORGOT PASSWORD COMPONENT - SEND OTP REQUEST STARTED');
    console.log('📱 Phone from state:', phone);
    console.log(
      '✅ Phone validation status:',
      state.phoneVerification.isPhoneValid
    );

    if (!state.phoneVerification.isPhoneValid) {
      console.log('❌ Phone validation failed, aborting OTP send');
      return;
    }

    console.log('🔄 Updating state to sending OTP...');
    this.forgotPasswordState.update((state) => ({
      ...state,
      phoneVerification: {
        ...state.phoneVerification,
        isSendingOTP: true,
        otpError: null,
      },
    }));

    console.log('🔄 Calling forgot password service requestPasswordReset...');
    this.forgotPasswordService.requestPasswordReset(phone).subscribe({
      next: (response: ForgotPasswordResponse) => {
        console.log('✅ FORGOT PASSWORD COMPONENT - OTP sent successfully');
        console.log('📦 Send OTP response:', response);

        this.forgotPasswordState.update((state) => ({
          ...state,
          phoneVerification: {
            ...state.phoneVerification,
            isSendingOTP: false,
            isOTPSent: true,
            canResend: false,
            resendCooldown: OTP_RESEND_COOLDOWN,
          },
          currentStep: 'otp',
        }));

        console.log('⏰ Starting resend timer...');
        this.startResendTimer();
      },
      error: (error) => {
        console.log('❌ FORGOT PASSWORD COMPONENT - Failed to send OTP');
        console.log('📦 Send OTP error:', error);

        let errorMessage = 'Failed to send verification code';
        if (error.status === 404) {
          errorMessage =
            'Phone number not found. Please check your phone number.';
        } else if (error.status === 400) {
          errorMessage = error.message || 'Invalid phone number format';
        }

        this.forgotPasswordState.update((state) => ({
          ...state,
          phoneVerification: {
            ...state.phoneVerification,
            isSendingOTP: false,
            otpError: errorMessage,
          },
        }));
      },
    });
  }

  // ==================== OTP INPUT ====================
  onOTPInput(otp: string): void {
    console.log('🔢 FORGOT PASSWORD COMPONENT - OTP input changed');
    console.log('🔢 Original OTP value:', otp);

    const cleanOTP = otp.replace(/\D/g, '').substring(0, 6);
    console.log('🔢 Cleaned OTP:', cleanOTP);

    const isValid = this.forgotPasswordService.isValidOTP(cleanOTP);
    console.log('✅ OTP validation result:', isValid);

    this.forgotPasswordState.update((state) => ({
      ...state,
      phoneVerification: {
        ...state.phoneVerification,
        otpCode: cleanOTP,
        otpError:
          isValid || cleanOTP.length === 0 ? null : 'OTP must be 6 digits',
      },
    }));
  }

  // ==================== VERIFY OTP ====================
  verifyOTP(): void {
    const state = this.forgotPasswordState();
    const otp = state.phoneVerification.otpCode;

    console.log('🔢 FORGOT PASSWORD COMPONENT - VERIFY OTP STARTED');
    console.log('🔢 OTP to verify:', otp);

    if (!state.phoneVerification.isOTPSent) return;

    if (!this.forgotPasswordService.isValidOTP(otp)) {
      this.forgotPasswordState.update((state) => ({
        ...state,
        phoneVerification: {
          ...state.phoneVerification,
          otpError: 'Please enter a valid 6-digit OTP',
        },
      }));
      return;
    }

    console.log('🔄 Validating OTP format and moving to password step...');

    this.forgotPasswordState.update((state) => ({
      ...state,
      phoneVerification: {
        ...state.phoneVerification,
        isVerifyingOTP: true,
        otpError: null,
      },
    }));

    // Simulate a brief verification delay for better UX
    setTimeout(() => {
      this.forgotPasswordState.update((state) => ({
        ...state,
        phoneVerification: {
          ...state.phoneVerification,
          isVerifyingOTP: false,
          isOTPVerified: true,
          otpError: null,
        },
        currentStep: 'password',
      }));
    }, 1000);
  }

  // ==================== RESEND OTP ====================
  resendOTP(): void {
    const state = this.forgotPasswordState();
    if (!state.phoneVerification.canResend) return;
    this.sendOTP();
  }

  // ==================== RESEND TIMER ====================
  private startResendTimer(): void {
    const resendTimerSubscription = interval(1000).subscribe(() => {
      this.forgotPasswordState.update((state) => {
        const newCooldown = state.phoneVerification.resendCooldown - 1;

        if (newCooldown <= 0) {
          resendTimerSubscription.unsubscribe();
          return {
            ...state,
            phoneVerification: {
              ...state.phoneVerification,
              resendCooldown: 0,
              canResend: true,
            },
          };
        }

        return {
          ...state,
          phoneVerification: {
            ...state.phoneVerification,
            resendCooldown: newCooldown,
          },
        };
      });
    });

    this.destroyRef.onDestroy(() => resendTimerSubscription.unsubscribe());
  }

  // ==================== PASSWORD INPUT ====================
  onPasswordInput(password: string): void {
    console.log('🔒 FORGOT PASSWORD COMPONENT - Password input changed');
    console.log('🔒 Password length:', password.length);

    this.forgotPasswordState.update((state) => ({
      ...state,
      formData: {
        ...state.formData,
        newPassword: password,
      },
    }));

    this.showPasswordStrength = password.length > 0;
    this.validatePasswords();
  }

  onConfirmPasswordInput(confirmPassword: string): void {
    console.log(
      '🔒 FORGOT PASSWORD COMPONENT - Confirm password input changed'
    );

    this.forgotPasswordState.update((state) => ({
      ...state,
      formData: {
        ...state.formData,
        confirmPassword: confirmPassword,
      },
    }));

    this.validatePasswords();
  }

  // ==================== PASSWORD VALIDATION ====================
  private validatePasswords(): void {
    const state = this.forgotPasswordState();
    const password = state.formData.newPassword;
    const confirmPassword = state.formData.confirmPassword;

    if (password || confirmPassword) {
      // Simple password validation
      const hasMinLength = password.length >= 8;
      const hasNumber = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      const passwordsMatch = password === confirmPassword;

      this.passwordValidation = {
        password: {
          score: hasMinLength && hasNumber && hasSpecialChar ? 75 : 25,
          strength:
            hasMinLength && hasNumber && hasSpecialChar ? 'strong' : 'weak',
          rules: [
            { text: 'At least 8 characters', isValid: hasMinLength },
            { text: 'Contains a number', isValid: hasNumber },
            { text: 'Contains a special character', isValid: hasSpecialChar },
          ],
        },
        confirmPassword: {
          isValid: passwordsMatch,
          error: passwordsMatch ? null : 'Passwords do not match',
        },
        overall: {
          canSubmit:
            hasMinLength && hasNumber && hasSpecialChar && passwordsMatch,
        },
      };
    } else {
      this.passwordValidation = null;
    }
  }

  // ==================== RESET PASSWORD ====================
  resetPassword(): void {
    const state = this.forgotPasswordState();

    console.log('🎯 FORGOT PASSWORD COMPONENT - RESET PASSWORD STARTED');
    console.log('📊 Current state:', state);
    console.log(
      '✅ OTP verified status:',
      state.phoneVerification.isOTPVerified
    );
    console.log(
      '✅ Password validation status:',
      this.passwordValidation?.overall?.canSubmit
    );

    if (!state.phoneVerification.isOTPVerified) {
      console.log('❌ OTP not verified, aborting password reset');
      return;
    }

    if (!this.passwordValidation?.overall?.canSubmit) {
      console.log('❌ Password validation failed, aborting password reset');
      return;
    }

    console.log('🔄 Setting submitting state...');
    this.forgotPasswordState.update((state) => ({
      ...state,
      isSubmitting: true,
      error: null,
    }));

    const phone = state.formData.phone;
    const newPassword = state.formData.newPassword;
    const otp = state.phoneVerification.otpCode;

    console.log('📱 Final reset password data:');
    console.log('  - Phone:', phone);
    console.log('  - New password length:', newPassword.length);
    console.log('  - OTP:', otp);

    console.log('🔄 Calling forgot password service resetPassword...');
    this.forgotPasswordService
      .resetPassword(phone, otp, newPassword)
      .subscribe({
        next: (response: ResetPasswordResponse) => {
          console.log(
            '✅ FORGOT PASSWORD COMPONENT - Password reset successful'
          );
          console.log('📦 Reset password response:', response);

          this.forgotPasswordState.update((state) => ({
            ...state,
            isSubmitting: false,
            currentStep: 'complete',
          }));

          console.log('🏠 Scheduling navigation to login page...');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error) => {
          console.log('❌ FORGOT PASSWORD COMPONENT - Password reset failed');
          console.log('📦 Reset password error:', error);

          let errorMessage = 'Password reset failed. Please try again.';

          if (error.status === 401) {
            errorMessage = 'Invalid or expired verification code';
          } else if (error.status === 400) {
            errorMessage =
              error.message ||
              'Invalid request. Please check your information.';
          } else if (error.status === 404) {
            errorMessage = 'User not found. Please check your phone number.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }

          this.forgotPasswordState.update((state) => ({
            ...state,
            isSubmitting: false,
            error: errorMessage,
          }));
        },
      });
  }

  // ==================== UTILITY METHODS ====================
  getCurrentStepNumber(): number {
    const stepMap = { phone: 1, otp: 2, password: 3, complete: 4 };
    return stepMap[this.forgotPasswordState().currentStep] || 1;
  }

  getCurrentStepTitle(): string {
    const titleMap = {
      phone: 'Enter Phone',
      otp: 'Verify Code',
      password: 'New Password',
      complete: 'Complete',
    };
    return titleMap[this.forgotPasswordState().currentStep] || 'Enter Phone';
  }

  getProgressPercentage(): number {
    const currentStep = this.getCurrentStepNumber();
    return (currentStep / 4) * 100;
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

  // ==================== NAVIGATION ====================
  goBackToLogin(): void {
    this.router.navigate(['/login']);
  }

  goBackStep(): void {
    const currentStep = this.forgotPasswordState().currentStep;

    if (currentStep === 'otp') {
      this.forgotPasswordState.update((state) => ({
        ...state,
        currentStep: 'phone',
        phoneVerification: {
          ...state.phoneVerification,
          isOTPSent: false,
          otpCode: '',
          otpError: null,
        },
      }));
    } else if (currentStep === 'password') {
      this.forgotPasswordState.update((state) => ({
        ...state,
        currentStep: 'otp',
      }));
    }
  }
}
