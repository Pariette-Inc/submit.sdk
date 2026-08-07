export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface User {
  id: number
  name: string
  email: string
  email_verified_at?: string
  phone?: string
  avatar?: string
  locale?: string
  created_at: string
  updated_at: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export interface TwoFactorSetupResponse {
  secret: string
  qr_code: string
}

export interface TwoFactorVerifyRequest {
  code: string
  temp_token?: string
}

export interface ProfileUpdateRequest {
  name?: string
  phone?: string
  avatar?: string
}
