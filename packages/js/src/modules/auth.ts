import { BaseModule } from './base'
import type { ApiResponse } from '../types/common'

export interface LoginPayload {
  email: string
  password: string
  /** Kalıcı cihaz tanımlayıcısı — giriş geçmişinde cihazı eşlemek için. */
  client_id?: string
}

export interface LoginResult {
  token?: string
  user?: AuthUser
  /** 2FA açıksa token yerine bu döner; `twoFactor.verify` ile tamamlanır. */
  two_factor_required?: boolean
  two_factor_token?: string
}

export interface AuthUser {
  id: number
  name?: string
  surname?: string
  email: string
  auth_group?: string
  environment?: string
  status?: number
  email_verified_at?: string | null
}

export interface RegisterPayload {
  name: string
  surname?: string
  email: string
  password: string
  password_confirmation: string
  phone?: string
}

/**
 * Kimlik doğrulama, hesap ve oturum işlemleri.
 *
 * Başarılı `login`/`register` sonrası JWT istemciye otomatik yazılır — ayrıca
 * `setAuthToken` çağırmanız gerekmez. `logout` da temizler.
 *
 * @example
 *   const { data } = await sdk.auth.login({ email, password })
 *   if (data?.two_factor_required) {
 *     await sdk.auth.twoFactor.verify({ token: data.two_factor_token!, code: '123456' })
 *   }
 */
export class AuthModule extends BaseModule {
  /**
   * E-posta + parola ile giriş. Site token'ı (`SubmitToken`) zorunludur.
   *
   * Rate limit: `throttle:auth`. 2FA açık hesaplarda token yerine
   * `two_factor_required` döner.
   */
  async login(payload: LoginPayload): Promise<ApiResponse<LoginResult>> {
    const res = await this.client.post<ApiResponse<LoginResult>>('/api/auth/login', payload)
    if (res.data?.token) this.client.setAuthToken(res.data.token)
    return res
  }

  /** Mobil uygulama girişi — web akışından ayrı tutulur (cihaz kaydı beklenir). */
  async loginApp(payload: LoginPayload): Promise<ApiResponse<LoginResult>> {
    const res = await this.client.post<ApiResponse<LoginResult>>('/api/auth/login-app', payload)
    if (res.data?.token) this.client.setAuthToken(res.data.token)
    return res
  }

  /** Panel (Console) girişi — site sahibi/ekip üyesi oturumu açar. */
  async console(payload: LoginPayload): Promise<ApiResponse<LoginResult>> {
    const res = await this.client.post<ApiResponse<LoginResult>>('/api/auth/console', payload)
    if (res.data?.token) this.client.setAuthToken(res.data.token)
    return res
  }

  /**
   * Yeni hesap açar.
   *
   * Hesabın doğrudan aktif olup olmayacağına **site** karar verir
   * (`environments.auto_activate`). Kapalıysa kullanıcı `waiting` grubuna düşer
   * ve onay bekler; bu davranış istemciden değiştirilemez.
   */
  register(payload: RegisterPayload): Promise<ApiResponse<LoginResult>> {
    return this.client.post('/api/auth/register', payload)
  }

  /** Hesap açıp aynı istekte yeni bir site kurar (onboarding akışı). */
  registerAndCreateEnvironment(
    payload: RegisterPayload & { site_title: string; site_type?: string }
  ): Promise<ApiResponse<LoginResult>> {
    return this.client.post('/api/auth/registerAndCreateEnvironment', payload)
  }

  /** Oturumu kapatır ve istemcideki JWT'yi temizler. */
  async logout(): Promise<ApiResponse<null>> {
    const res = await this.client.post<ApiResponse<null>>('/api/auth/logout', {})
    this.client.setAuthToken(null)
    return res
  }

  /** Oturum açmış kullanıcı. Yalnızca JWT ister, site token'ı gerekmez. */
  me(): Promise<ApiResponse<AuthUser>> {
    return this.client.get('/api/auth/me')
  }

  /**
   * JWT'yi yeniler ve istemciye yazar.
   *
   * `onTokenRefresh` yapılandırdıysanız 401 alındığında bu zaten otomatik
   * çalışır — elle çağırmak yalnızca proaktif yenileme içindir.
   */
  async refresh(): Promise<ApiResponse<{ token: string }>> {
    const res = await this.client.get<ApiResponse<{ token: string }>>('/api/auth/refresh')
    if (res.data?.token) this.client.setAuthToken(res.data.token)
    return res
  }

  /** Kullanıcının erişebildiği siteler — panelde site seçici bunu kullanır. */
  myEnvironments(): Promise<ApiResponse<Array<{ id: number; token: string; title: string }>>> {
    return this.client.get('/api/my-environments')
  }

  // ── Parola ────────────────────────────────────────────────────────────────

  /** Sıfırlama bağlantısı gönderir. Rate limit: `throttle:forgot-password`. */
  forgotPassword(email: string): Promise<ApiResponse<null>> {
    return this.client.post('/api/auth/forgot-password', { email })
  }

  /** Sıfırlama e-postasını yeniden gönderir. */
  resendForgotPasswordMail(email: string): Promise<ApiResponse<null>> {
    return this.client.post('/api/auth/resend-forgot-password-mail', { email })
  }

  /** Sıfırlama bağlantısındaki token hâlâ geçerli mi — formu göstermeden önce. */
  checkResetToken(token: string): Promise<ApiResponse<{ valid: boolean }>> {
    return this.client.get('/api/auth/check-reset-token', { params: { token } })
  }

  resetPassword(payload: {
    token: string
    email: string
    password: string
    password_confirmation: string
  }): Promise<ApiResponse<null>> {
    return this.client.post('/api/auth/reset-password', payload)
  }

  /** Oturum içi parola değişimi — mevcut parola zorunlu. */
  updatePassword(payload: {
    current_password: string
    password: string
    password_confirmation: string
  }): Promise<ApiResponse<null>> {
    return this.client.post('/api/auth/password/update', payload)
  }

  // ── Hesap ─────────────────────────────────────────────────────────────────

  updateProfile(payload: Partial<Pick<AuthUser, 'name' | 'surname'>> & Record<string, unknown>): Promise<
    ApiResponse<AuthUser>
  > {
    return this.client.post('/api/auth/profile/update', payload)
  }

  /** E-posta değişimi — yeni adrese doğrulama gider. */
  updateEmail(payload: { email: string; password: string }): Promise<ApiResponse<null>> {
    return this.client.post('/api/auth/email/update', payload)
  }

  /** Giriş yöntemini değiştirir (parola / Google / 2FA zorunluluğu). */
  updateAuthMethod(payload: Record<string, unknown>): Promise<ApiResponse<null>> {
    return this.client.post('/api/auth/auth-method/update', payload)
  }

  /** E-posta ile gelen aktivasyon bağlantısını tamamlar. */
  activateAccount(token: string): Promise<ApiResponse<null>> {
    return this.client.put(`/api/auth/account-activation/${encodeURIComponent(token)}`, {})
  }

  // ── Davet ─────────────────────────────────────────────────────────────────

  /** Davet bağlantısındaki bilgileri okur (kimin, hangi siteye davet ettiği). */
  invitation(token: string): Promise<ApiResponse<{ email: string; environment: string }>> {
    return this.client.get(`/api/auth/invitation/${encodeURIComponent(token)}`)
  }

  /** Daveti kabul edip hesabı tamamlar. */
  completeInvitation(payload: {
    token: string
    name: string
    surname?: string
    password: string
    password_confirmation: string
  }): Promise<ApiResponse<LoginResult>> {
    return this.client.post('/api/auth/complete-invitation', payload)
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  /**
   * Google ile giriş akışı tarayıcı yönlendirmesiyle yürür — XHR ile çağrılamaz.
   * Kullanıcıyı bu adrese gönderin; dönüşte `callback` sizin sitenize yönlendirir.
   */
  googleRedirectUrl(): string {
    return `${this.client.baseUrl}/api/auth/google/redirect`
  }

  // ── 2FA ───────────────────────────────────────────────────────────────────

  readonly twoFactor = {
    /** TOTP kurulumu başlatır — QR için `otpauth://` URI'si döner. */
    setup: (): Promise<ApiResponse<{ secret: string; qr: string }>> =>
      this.client.post('/api/auth/2fa/setup', {}),

    /** Kurulumu ilk kodla onaylar. */
    confirm: (code: string): Promise<ApiResponse<{ recovery_codes: string[] }>> =>
      this.client.post('/api/auth/2fa/confirm', { code }),

    /**
     * Girişteki 2FA adımını tamamlar. `login` yanıtındaki `two_factor_token`
     * ile birlikte gönderilir; başarılıysa JWT istemciye yazılır.
     */
    verify: async (payload: { token: string; code: string }): Promise<ApiResponse<LoginResult>> => {
      const res = await this.client.post<ApiResponse<LoginResult>>('/api/auth/2fa/verify', payload)
      if (res.data?.token) this.client.setAuthToken(res.data.token)
      return res
    },

    disable: (password: string): Promise<ApiResponse<null>> =>
      this.client.post('/api/auth/2fa/disable', { password }),
  }

  // ── Cihaz (push bildirimi) ────────────────────────────────────────────────

  readonly device = {
    /** Push token'ı kaydeder (Expo / FCM / APNs). */
    register: (payload: { token: string; platform?: 'ios' | 'android' | 'web' }): Promise<ApiResponse<null>> =>
      this.client.post('/api/auth/device/register', payload),

    remove: (token: string): Promise<ApiResponse<null>> =>
      this.client.post('/api/auth/device/remove', { token }),
  }
}
