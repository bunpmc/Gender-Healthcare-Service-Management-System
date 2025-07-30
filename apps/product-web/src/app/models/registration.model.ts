// ========== REGISTRATION FLOW INTERFACES ==========

export interface RegistrationStep {
  step: 'phone' | 'otp' | 'password' | 'complete';
  isValid: boolean;
  canProceed: boolean;
}

export interface PhoneVerificationState {
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
}

export interface RegistrationFormData {
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface RegistrationState {
  currentStep: RegistrationStep['step'];
  phoneVerification: PhoneVerificationState;
  formData: RegistrationFormData;
  isSubmitting: boolean;
  error: string | null;
}

// ========== CONSTANTS ==========

export const REGISTRATION_STEPS: Record<RegistrationStep['step'], {
  title: string;
  description: string;
  order: number;
}> = {
  phone: {
    title: 'Phone Verification',
    description: 'Enter your phone number to receive verification code',
    order: 1
  },
  otp: {
    title: 'Enter Verification Code',
    description: 'Enter the 6-digit code sent to your phone',
    order: 2
  },
  password: {
    title: 'Create Password',
    description: 'Create a secure password for your account',
    order: 3
  },
  complete: {
    title: 'Registration Complete',
    description: 'Your account has been created successfully',
    order: 4
  }
};

export const OTP_RESEND_COOLDOWN = 60; // seconds
export const OTP_EXPIRY_TIME = 5 * 60; // 5 minutes in seconds

// ========== HELPER FUNCTIONS ==========

export function createInitialRegistrationState(): RegistrationState {
  return {
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
      canResend: true
    },
    formData: {
      phone: '',
      password: '',
      confirmPassword: ''
    },
    isSubmitting: false,
    error: null
  };
}

export function validatePhoneNumber(phone: string): {
  isValid: boolean;
  error: string | null;
} {
  if (!phone || phone.trim() === '') {
    return {
      isValid: false,
      error: 'Phone number is required'
    };
  }

  // Remove any spaces or formatting
  const cleanPhone = phone.replace(/\s/g, '');

  // Vietnamese phone number validation
  const phonePattern = /^0\d{9}$/;
  if (!phonePattern.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'Please enter a valid Vietnamese phone number (10 digits starting with 0)'
    };
  }

  return {
    isValid: true,
    error: null
  };
}

export function validateOTP(otp: string): {
  isValid: boolean;
  error: string | null;
} {
  if (!otp || otp.trim() === '') {
    return {
      isValid: false,
      error: 'Verification code is required'
    };
  }

  // Remove any spaces
  const cleanOTP = otp.replace(/\s/g, '');

  // OTP should be exactly 6 digits
  const otpPattern = /^\d{6}$/;
  if (!otpPattern.test(cleanOTP)) {
    return {
      isValid: false,
      error: 'Verification code must be 6 digits'
    };
  }

  return {
    isValid: true,
    error: null
  };
}

export function formatPhoneForDisplay(phone: string): string {
  if (!phone || phone.length !== 10) return phone;
  
  // Format: 0123 456 789
  return `${phone.substring(0, 4)} ${phone.substring(4, 7)} ${phone.substring(7)}`;
}

export function formatOTPForDisplay(otp: string): string {
  if (!otp) return '';
  
  // Remove any non-digits
  const cleanOTP = otp.replace(/\D/g, '');
  
  // Limit to 6 digits
  const limitedOTP = cleanOTP.substring(0, 6);
  
  // Format as XXX XXX
  if (limitedOTP.length > 3) {
    return `${limitedOTP.substring(0, 3)} ${limitedOTP.substring(3)}`;
  }
  
  return limitedOTP;
}

export function getStepProgress(currentStep: RegistrationStep['step']): {
  current: number;
  total: number;
  percentage: number;
} {
  const stepOrder = REGISTRATION_STEPS[currentStep].order;
  const totalSteps = Object.keys(REGISTRATION_STEPS).length - 1; // Exclude 'complete' step
  
  return {
    current: stepOrder,
    total: totalSteps,
    percentage: Math.round((stepOrder / totalSteps) * 100)
  };
}
