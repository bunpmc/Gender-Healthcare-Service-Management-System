export interface UserRegister {
  phone: string;
  password: string;
}

export interface UserLogin {
  phone: string;
  password: string;
}

export interface UserId {
  id: string;
}

export interface ContactMessage {
  fullName: string;
  email: string;
  phone: string;
  schedule: string;
  message: string;
}

export interface ForgotPasswordRequest {
  phone: string;
}
export interface ResetPasswordRequest {
  phone: string;
  otp: string;
  password: string;
}
