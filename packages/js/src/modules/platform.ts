import { BaseModule } from './base'
import type { ApiResponse } from '../types/common'

/**
 * Müşterinin kendi sitesini yönettiği self-servis uçlar (`platform/my`).
 *
 * Site üyeliği zorunludur — başka bir sitenin verisine erişilemez.
 *
 * @example
 *   const { data } = await sdk.platform.overview()
 *   await sdk.platform.domains.add('magazam.com')
 */
export class PlatformModule extends BaseModule {
  /** Plan, kota kullanımı ve site durumu tek bakışta. */
  overview(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get('/api/platform/my/overview')
  }

  /** Trafik ve istek özeti (telemetriden). */
  analytics(params: Record<string, unknown> = {}): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get('/api/platform/my/analytics', { params })
  }

  payments(params: Record<string, unknown> = {}): Promise<ApiResponse<Array<Record<string, unknown>>>> {
    return this.client.get('/api/platform/my/payments', { params })
  }

  readonly receipts = {
    list: (): Promise<ApiResponse<Array<Record<string, unknown>>>> =>
      this.client.get('/api/platform/my/receipts'),

    /** PDF adresi — indirme bağlantısı olarak verin, SDK ikili veri döndürmez. */
    pdfUrl: (id: number): string => `${this.client.baseUrl}/api/platform/my/receipts/${id}/pdf`,
  }

  /**
   * Abonelik yönetimi.
   *
   * Plan değiştirmede kural: YÜKSELTME dönemin kalan günleri için fark tahsil
   * edilerek hemen uygulanır (`mode: "payment"` + `pay_url`), DÜŞÜRME tahsilat
   * olmadan dönem sonuna randevulanır (`mode: "scheduled"`). Plan, müşterinin
   * ödediği para biriminde satılmıyorsa geçiş reddedilir.
   */
  readonly subscription = {
    /** Uzatma ödemesi başlatır; yanıttaki `pay_url` ödeme ekranına götürür. */
    renew: (period: 'monthly' | 'yearly'): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post('/api/platform/my/subscription/renew', { period }),

    /** Geçilebilecek planlar: her biri için şimdi ödenecek fark ve dönem fiyatı. */
    plans: (params: Record<string, unknown> = {}): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.get('/api/platform/my/subscription/plans', { params }),

    changePlan: (packageId: number, period: 'monthly' | 'yearly'): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post('/api/platform/my/subscription/change-plan', { package_id: packageId, period }),

    /** Dönem sonuna randevulanmış düşürmeyi iptal eder. */
    cancelPendingChange: (): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.delete('/api/platform/my/subscription/pending-change'),
  }

  /** Sitede açık/kapalı modüller ve satın alınabilir olanlar. */
  readonly modules = {
    list: (): Promise<ApiResponse<Array<Record<string, unknown>>>> =>
      this.client.get('/api/platform/my/modules'),

    /** Modülü satın alır — ödeme gerekiyorsa yanıtta yönlendirme döner. */
    purchase: (code: string, payload: Record<string, unknown> = {}): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post(`/api/platform/my/modules/${encodeURIComponent(code)}/purchase`, payload),
  }

  /**
   * Özel alan adları.
   *
   * `add` sonrası dönen TXT kaydını müşteri DNS'ine ekler, sonra `verify`
   * çağrılır. Doğrulama kaydı `_submit.<alan adı>` altında aranır.
   */
  readonly domains = {
    list: (): Promise<ApiResponse<Array<Record<string, unknown>>>> =>
      this.client.get('/api/platform/my/domains'),

    add: (domain: string): Promise<ApiResponse<{ host: string; value: string; instruction: string }>> =>
      this.client.post('/api/platform/my/domains', { domain }),

    verify: (id: number): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post(`/api/platform/my/domains/${id}/verify`, {}),

    remove: (id: number): Promise<ApiResponse<null>> =>
      this.client.delete(`/api/platform/my/domains/${id}`),
  }

  /** Site ekibi ve davetler. */
  readonly team = {
    list: (): Promise<ApiResponse<Record<string, unknown>>> => this.client.get('/api/platform/my/team'),

    invite: (payload: { email: string; role?: string }): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post('/api/platform/my/team/invite', payload),

    cancelInvitation: (id: number): Promise<ApiResponse<null>> =>
      this.client.delete(`/api/platform/my/team/invitations/${id}`),

    removeMember: (id: number): Promise<ApiResponse<null>> =>
      this.client.delete(`/api/platform/my/team/members/${id}`),
  }

  /** Herkese açık paket listesi — fiyatlandırma sayfası için. Oturum gerekmez. */
  plans(): Promise<ApiResponse<Array<Record<string, unknown>>>> {
    return this.client.get('/api/platform/plans')
  }

  /**
   * Ödeme bağlantısı akışı — oturum gerektirmez, bağlantıyı alan herkes kullanır.
   * Partner müşterisine gönderilen "öde" sayfası bunları çağırır.
   */
  readonly pay = {
    get: (token: string): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.get(`/api/platform/pay/${encodeURIComponent(token)}`),

    card: (token: string, payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post(`/api/platform/pay/${encodeURIComponent(token)}/card`, payload),

    bankTransfer: (token: string, payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post(`/api/platform/pay/${encodeURIComponent(token)}/bank-transfer`, payload),
  }

  /** Whitelabel partner açılış sayfası. */
  readonly site = {
    get: (slug: string): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.get(`/api/platform/site/${encodeURIComponent(slug)}`),

    buyPackage: (slug: string, packageId: number, payload: Record<string, unknown> = {}): Promise<
      ApiResponse<Record<string, unknown>>
    > =>
      this.client.post(
        `/api/platform/site/${encodeURIComponent(slug)}/packages/${packageId}/buy`,
        payload
      ),
  }
}

/**
 * Partner paneli — bayi/ajans tarafı.
 *
 * Partner kendi müşterilerini, paketlerini ve tahsilatını yönetir.
 * Bu uçlar partner rolündeki oturum ister.
 */
export class PartnerModule extends BaseModule {
  dashboard(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get('/api/platform/partner/dashboard')
  }

  settings(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get('/api/platform/partner/settings')
  }

  updateSettings(payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.put('/api/platform/partner/settings', payload)
  }

  modules(): Promise<ApiResponse<Array<Record<string, unknown>>>> {
    return this.client.get('/api/platform/partner/modules')
  }

  readonly customers = {
    list: (params: Record<string, unknown> = {}): Promise<ApiResponse<Array<Record<string, unknown>>>> =>
      this.client.get('/api/platform/partner/customers', { params }),

    get: (id: number): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.get(`/api/platform/partner/customers/${id}`),

    /** Müşteriye özel fiyat tanımlar. */
    setPrices: (id: number, payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post(`/api/platform/partner/customers/${id}/prices`, payload),
  }

  readonly packages = {
    list: (): Promise<ApiResponse<Array<Record<string, unknown>>>> =>
      this.client.get('/api/platform/partner/packages'),
    create: (payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post('/api/platform/partner/packages', payload),
    update: (id: number, payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.put(`/api/platform/partner/packages/${id}`, payload),
    delete: (id: number): Promise<ApiResponse<null>> =>
      this.client.delete(`/api/platform/partner/packages/${id}`),
  }

  /** Ödeme bağlantıları — müşteriye gönderilen tek kullanımlık tahsilat linki. */
  readonly checkoutLinks = {
    list: (): Promise<ApiResponse<Array<Record<string, unknown>>>> =>
      this.client.get('/api/platform/partner/checkout-links'),
    create: (payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post('/api/platform/partner/checkout-links', payload),
    /** Bağlantıyı müşteriye e-postayla yollar. */
    send: (id: number): Promise<ApiResponse<null>> =>
      this.client.post(`/api/platform/partner/checkout-links/${id}/send`, {}),
    cancel: (id: number): Promise<ApiResponse<null>> =>
      this.client.post(`/api/platform/partner/checkout-links/${id}/cancel`, {}),
  }

  /** Partnerin kendi ödeme altyapısı (kendi tahsil ettiği senaryo). */
  readonly gateways = {
    list: (): Promise<ApiResponse<Array<Record<string, unknown>>>> =>
      this.client.get('/api/platform/partner/gateways'),
    create: (payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post('/api/platform/partner/gateways', payload),
    update: (id: number, payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.put(`/api/platform/partner/gateways/${id}`, payload),
    delete: (id: number): Promise<ApiResponse<null>> =>
      this.client.delete(`/api/platform/partner/gateways/${id}`),
    /** Anahtarları test eder — kaydetmeden önce doğrulama. */
    verify: (id: number): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post(`/api/platform/partner/gateways/${id}/verify`, {}),
  }

  readonly bankTransfers = {
    list: (): Promise<ApiResponse<Array<Record<string, unknown>>>> =>
      this.client.get('/api/platform/partner/bank-transfers'),
    /** Havale bildirimini onaylar ya da reddeder. */
    review: (id: number, payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post(`/api/platform/partner/bank-transfers/${id}/review`, payload),
  }

  readonly transfers = {
    list: (): Promise<ApiResponse<Array<Record<string, unknown>>>> =>
      this.client.get('/api/platform/partner/transfers'),
    create: (payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post('/api/platform/partner/transfers', payload),
    respond: (id: number, payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post(`/api/platform/partner/transfers/${id}/respond`, payload),
  }

  receiptPdfUrl(id: number): string {
    return `${this.client.baseUrl}/api/platform/partner/receipts/${id}/pdf`
  }
}
