import { BaseModule } from './base'
import type { ApiResponse } from '../types/common'

/**
 * Rezervasyonun ölçü birimi. Otel gece sayar, ekipman kirası gün, randevu saat.
 * Süre hesabı buna göre yapılır: `night`/`day` takvim günü sayar, `hour`
 * başlanan saati yukarı yuvarlar.
 */
export type ReservationUnit = 'night' | 'day' | 'hour'

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

/** Müsaitliğin neden reddedildiği — arayüz mesajı buna göre seçilir. */
export type ReservationUnavailableReason =
  | 'not_reservable'
  | 'invalid_range'
  | 'invalid_quantity'
  | 'too_soon'
  | 'below_min_units'
  | 'above_max_units'
  | 'outside_season'
  | 'full'

export interface ReservationSettings {
  id: number
  record_id: number
  record: { id: number; slug: string | null; title: string | null } | null
  /** Kaç talebin AYNI ANDA aynı aralığı tutabileceği: 3 aynı oda, tek doktor. */
  capacity: number
  unit: ReservationUnit
  min_units: number | null
  max_units: number | null
  /** En erken ne kadar sonrasına rezervasyon alınır. */
  lead_time_hours: number
  /** İki randevu arası hazırlık payı. */
  buffer_minutes: number
  season_start: string | null
  season_end: string | null
  /** Kapalıysa gelen talep `pending` düşer ve personel onaylar. */
  auto_confirm: boolean
  base_price: number
  currency: string
  active: boolean
}

export interface ReservationSettingsPayload {
  capacity: number
  unit: ReservationUnit
  min_units?: number
  max_units?: number | null
  lead_time_hours?: number
  buffer_minutes?: number
  season_start?: string | null
  season_end?: string | null
  auto_confirm?: boolean
  base_price?: number
  currency?: string
  active?: boolean
}

export interface ReservationBlock {
  id: number
  starts_at: string
  ends_at: string
  quantity: number
  reason: string | null
}

export interface ReservationRate {
  id: number
  name: string | null
  starts_on: string
  ends_on: string
  price: number
  min_units: number | null
  priority: number
}

export interface Reservation {
  id: number
  /** Müşteriye söylenen kısa referans ("REZ-8F3K2P"). */
  code: string
  status: ReservationStatus
  starts_at: string
  ends_at: string
  /** Kaç birim tutuluyor: 2 oda, 1 masa, 4 koltuk. */
  quantity: number
  /** Kaç kişi gelecek — kapasiteden ayrı, bilgi amaçlı. */
  guests: number | null
  guest_name: string
  guest_email: string | null
  guest_phone: string | null
  /** Rezervasyon anında DONDURULMUŞ tutar; sezon fiyatı sonradan değişse de sabittir. */
  price: number
  currency: string
  source: 'public' | 'console'
  created_at: string
  record: { id: number; slug: string | null; title: string | null } | null
  content_type: { code: string; name: string } | null
}

export interface ReservationDetail extends Reservation {
  note: string | null
  meta: Record<string, unknown> | null
}

export interface ReservationListParams {
  status?: ReservationStatus
  record_id?: number
  /** İçerik tipi kodu (`otel_odasi`). */
  type?: string
  /** Aralıkla KESİŞENLERİ getirir: 1 Eylül sorgusu 28 Ağustos'ta başlayanı da bulur. */
  from?: string
  to?: string
  /** Kod, ad, e-posta veya telefonda arar. */
  q?: string
  page?: number
  per_page?: number
}

export interface ReservationPayload {
  record_id: number
  starts_at: string
  ends_at: string
  quantity?: number
  guests?: number
  guest_name: string
  guest_email?: string
  guest_phone?: string
  note?: string
}

/** Panel takvimi — kalan kapasite görünür. */
export interface ReservationCalendarDay {
  date: string
  capacity: number
  used: number
  remaining: number
  price: number
}

/** Panel müsaitlik yanıtı. */
export interface ReservationCheckResult {
  available: boolean
  reason: ReservationUnavailableReason | null
  message: string | null
  capacity: number
  used: number
  remaining: number
  units: number
  price: number
  currency: string
  breakdown: Array<{ date: string; price: number }>
}

/**
 * Rezervasyon yönetimi (panel tarafı).
 *
 * **Oturum ister** ve `reservations` modülü açık olmalıdır. Ziyaretçi tarafı
 * (müsaitlik sorgusu ve talep gönderme) oturumsuzdur ve
 * `sdk.delivery.reservations` altındadır.
 *
 * Rezerve edilen şey bir KAYITTIR: otel odası, doktor, masa, tur — hepsi kendi
 * içerik tipinde birer kayıt. Bir kaydı rezervasyona AÇAN şey `settings.save()`
 * çağrısıdır; ayarı olmayan kayıtta müsaitlik `not_reservable` döner.
 *
 * @example
 *   // 1. Odayı rezervasyona aç
 *   await sdk.reservations.settings.save(42, {
 *     capacity: 3, unit: 'night', min_units: 2, base_price: 1500, auto_confirm: true,
 *   })
 *
 *   // 2. Sezon fiyatı
 *   await sdk.reservations.rates.add(42, {
 *     name: 'Yüksek sezon', starts_on: '2027-07-01', ends_on: '2027-08-31', price: 2500,
 *   })
 *
 *   // 3. Gelen kutusu
 *   const { data } = await sdk.reservations.list({ status: 'pending' })
 */
export class ReservationModule extends BaseModule {
  /**
   * Rezervasyon gelen kutusu. `meta.counts` durum başına sayaç taşır —
   * sekmeleri bununla çizin.
   */
  list(params: ReservationListParams = {}): Promise<
    ApiResponse<Reservation[]> & {
      meta?: {
        current_page: number
        last_page: number
        per_page: number
        total: number
        counts: Record<string, number>
      }
    }
  > {
    return this.client.get('/api/reservations', { params })
  }

  get(id: number): Promise<ApiResponse<ReservationDetail>> {
    return this.client.get(`/api/reservations/${id}`)
  }

  /**
   * Elle rezervasyon (telefonla gelen talep).
   *
   * Site formuyla AYNI kapıdan geçer: çakışan tarihler 422 ile reddedilir,
   * gerekçe `errors` alanında insan diliyle döner.
   */
  create(payload: ReservationPayload): Promise<ApiResponse<ReservationDetail>> {
    return this.client.post('/api/reservations', payload)
  }

  /**
   * Durum değişikliği ve tarih taşıma.
   *
   * `starts_at` / `ends_at` / `quantity` gönderilirse çakışma kontrolü yeniden
   * çalışır; kaydın KENDİ eski aralığı engel sayılmaz.
   *
   * İptal silme değildir: `status: 'cancelled'` kaydı bırakır, yalnız
   * kapasiteyi serbest eder.
   */
  update(
    id: number,
    payload: Partial<ReservationPayload> & { status?: ReservationStatus }
  ): Promise<ApiResponse<ReservationDetail>> {
    return this.client.put(`/api/reservations/${id}`, payload)
  }

  /** Rezervasyonu çöp kutusuna taşır (kayıtlarla aynı soft-delete kuralı). */
  delete(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.client.delete(`/api/reservations/${id}`)
  }

  /**
   * Doluluk takvimi — gün gün kalan kapasite ve o günün fiyatı.
   *
   * Gece sayan birimlerde ÇIKIŞ GÜNÜ boş görünür: 12'sinde öğlen çıkan misafir
   * 12 gecesini tutmaz, o akşam oda yeniden satılır.
   *
   * Tek çağrıda en çok 120 gün döner.
   */
  calendar(
    recordId: number,
    from: string,
    to: string
  ): Promise<ApiResponse<ReservationCalendarDay[]> & { meta?: { max_days: number } }> {
    return this.client.get('/api/reservations/calendar', {
      params: { record_id: recordId, from, to },
    })
  }

  /** "Bu tarihlerde açık mı, kaça?" — yazmadan önce kontrol. */
  check(params: {
    record_id: number
    starts_at: string
    ends_at: string
    quantity?: number
  }): Promise<ApiResponse<ReservationCheckResult>> {
    return this.client.get('/api/reservations/check', { params })
  }

  /**
   * Bir kaydı rezervasyona açan kurallar.
   *
   * @example
   *   const { data } = await sdk.reservations.settings.list()
   *   await sdk.reservations.settings.close(42)   // yeni talep alma, geçmiş durur
   */
  readonly settings = {
    /** Sitedeki rezerve edilebilir kayıtlar. */
    list: (): Promise<ApiResponse<ReservationSettings[]>> =>
      this.client.get('/api/reservations/settings'),

    /** Kaydın ayarları + kapalı tarihleri + sezon fiyatları tek yanıtta. */
    get: (
      recordId: number
    ): Promise<
      ApiResponse<{
        record: { id: number; slug: string | null; title: string | null }
        settings: ReservationSettings | null
        blocks: ReservationBlock[]
        rates: ReservationRate[]
      }>
    > => this.client.get(`/api/reservations/settings/${recordId}`),

    /** Kur ya da güncelle — kaydı rezervasyona AÇAN çağrı budur. */
    save: (
      recordId: number,
      payload: ReservationSettingsPayload
    ): Promise<ApiResponse<ReservationSettings>> =>
      this.client.put(`/api/reservations/settings/${recordId}`, payload),

    /** Rezervasyona kapatır: yeni talep alınmaz, geçmiş kayıtlar durur. */
    close: (recordId: number): Promise<ApiResponse<{ closed: boolean }>> =>
      this.client.delete(`/api/reservations/settings/${recordId}`),
  }

  /**
   * Elle kapatma: bakım, tatil, özel kullanım. Rezervasyonla aynı şekilde
   * kapasiteden düşer — tek fark, karşısında müşteri olmamasıdır.
   */
  readonly blocks = {
    add: (
      recordId: number,
      payload: { starts_at: string; ends_at: string; quantity?: number; reason?: string }
    ): Promise<ApiResponse<ReservationBlock>> =>
      this.client.post(`/api/reservations/settings/${recordId}/blocks`, payload),

    remove: (recordId: number, blockId: number): Promise<ApiResponse<{ deleted: boolean }>> =>
      this.client.delete(`/api/reservations/settings/${recordId}/blocks/${blockId}`),
  }

  /**
   * Tarih aralığına özel fiyat. Kapsanmayan günler `base_price` ile hesaplanır;
   * çakışan aralıklarda `priority` büyük olan kazanır.
   *
   * Fiyat rezervasyon yazılırken KOPYALANIR: tarifeyi sonradan değiştirmek eski
   * rezervasyonların tutarını değiştirmez.
   */
  readonly rates = {
    add: (
      recordId: number,
      payload: {
        starts_on: string
        ends_on: string
        price: number
        name?: string
        min_units?: number
        priority?: number
      }
    ): Promise<ApiResponse<ReservationRate>> =>
      this.client.post(`/api/reservations/settings/${recordId}/rates`, payload),

    remove: (recordId: number, rateId: number): Promise<ApiResponse<{ deleted: boolean }>> =>
      this.client.delete(`/api/reservations/settings/${recordId}/rates/${rateId}`),
  }
}
