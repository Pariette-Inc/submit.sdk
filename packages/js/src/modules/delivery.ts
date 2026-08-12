import { BaseModule } from './base'
import type { ApiResponse } from '../types/common'
import type { RecordListParams, SubmitRecord, PageMeta } from './records'

/**
 * Yeni ticket açarken gönderilen gövde (`submitTicket`).
 *
 * Alanların tamamı submit.api tarafından **zorunlu** tutulur; boş gövde
 * gönderildiğinde dönen 422 tam olarak bu listeyi verir.
 */
export interface TicketPayload {
  /** Talep türü — panelde tanımlı iletişim/destek türünün kodu. */
  type: string
  subject: string
  /** Gönderen kimliği. Misafir gönderimlerinde de zorunludur. */
  user: string | number
  name: string
  email: string
  /** KVKK/GDPR aydınlatma onayı. */
  gdpr: boolean
  /** Ticari ileti (reklam) izni. */
  advertising: boolean
  /** Veri işleme onayı. */
  drp: boolean
  /** Talebin metni. Zorunlu alanlar arasında sayılmaz ama formlarda beklenir. */
  message?: string
  phone?: string
  [key: string]: unknown
}

/** Mevcut bir ticket'a mesaj eklerken gönderilen gövde (`ticketForm`). */
export interface TicketMessagePayload {
  /** Mesajın ekleneceği ticket. */
  ticket: string | number
  message: string
  [key: string]: unknown
}

/**
 * Genel teslimat — sitenizin ziyaretçilere gösterdiği her şey.
 *
 * Bu modülün tamamı **yalnızca site token'ı** ister; oturum gerekmez. Sunucuda
 * önbelleklenir ve **yalnızca yayımlanmış** içeriği döndürür. Bir sitenin
 * önyüzünü kuruyorsanız neredeyse tek ihtiyacınız budur.
 *
 * @example
 *   const sdk = new SubmitCms({ mode: 'production', token: process.env.SUBMIT_TOKEN! })
 *   const { data } = await sdk.delivery.records('blog', { per_page: 10, locale: 'tr' })
 */
export class DeliveryModule extends BaseModule {
  // ── İçerik ────────────────────────────────────────────────────────────────

  /**
   * Yayımlanmış kayıtları listeler. Filtre/sıralama seçenekleri panel tarafıyla
   * aynıdır; `status` gönderilse bile taslak dönmez.
   */
  records(
    typeCode: string,
    params: Omit<RecordListParams, 'status'> = {}
  ): Promise<ApiResponse<SubmitRecord[]> & { meta?: PageMeta }> {
    return this.client.get(`/api/public/records/${encodeURIComponent(typeCode)}`, { params })
  }

  /** Slug ile tek kayıt. Aynı slug birden çok dilde varsa `locale` verin. */
  record(typeCode: string, slug: string, params: { locale?: string } = {}): Promise<ApiResponse<SubmitRecord>> {
    return this.client.get(
      `/api/public/records/${encodeURIComponent(typeCode)}/item/${encodeURIComponent(slug)}`,
      { params }
    )
  }

  /** "Bunlar da ilginizi çekebilir" — aynı kategoriden ilgili kayıtlar. */
  alsoRead(typeCode: string, slug: string): Promise<ApiResponse<SubmitRecord[]>> {
    return this.client.get(
      `/api/public/records/${encodeURIComponent(typeCode)}/item/${encodeURIComponent(slug)}/also-read`
    )
  }

  /**
   * Görüntülenme kaydeder. `duration` saniye cinsinden okuma süresidir.
   * Sayfa kapanırken göndermek için `navigator.sendBeacon` da kullanılabilir.
   */
  ping(typeCode: string, slug: string, duration = 0): Promise<ApiResponse<null>> {
    return this.client.post(
      `/api/public/records/${encodeURIComponent(typeCode)}/item/${encodeURIComponent(slug)}/ping`,
      { duration }
    )
  }

  /** Tipin genel şeması — alan adları ve tipleri. Kendi arayüzünüzü kurarken. */
  schema(typeCode: string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get(`/api/public/records/${encodeURIComponent(typeCode)}/schema`)
  }

  categories(): Promise<ApiResponse<Array<{ id: number; name: string; slug: string }>>> {
    return this.client.get('/api/public/categories')
  }

  category(slug: string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get(`/api/public/categories/${encodeURIComponent(slug)}`)
  }

  /** Menüyü çözülmüş ağaç olarak döner — bağlantı hedefleri hesaplanmıştır. */
  menu(code: string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get(`/api/public/menus/${encodeURIComponent(code)}`)
  }

  // ── Site ──────────────────────────────────────────────────────────────────

  /**
   * Önyüzün açılışta ihtiyaç duyduğu her şey tek istekte: site bilgileri,
   * tasarım, diller, menüler. İlk yüklemede bunu çağırmak birkaç isteği birleştirir.
   */
  init(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get('/api/public/init')
  }

  environment(token: string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get(`/api/public/environment/${encodeURIComponent(token)}`)
  }

  navigation(slug: string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get(`/api/public/navigation/${encodeURIComponent(slug)}`)
  }

  banners(): Promise<ApiResponse<Array<Record<string, unknown>>>> {
    return this.client.get('/api/public/banners')
  }

  gallery(slug: string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get(`/api/public/gallery/${encodeURIComponent(slug)}`)
  }

  // ── Katalog (okuma) ───────────────────────────────────────────────────────

  products(params: Record<string, unknown> = {}): Promise<ApiResponse<Array<Record<string, unknown>>>> {
    return this.client.get('/api/public/products', { params })
  }

  product(slug: string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get(`/api/public/product/${encodeURIComponent(slug)}`)
  }

  productCategory(slug: string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get(`/api/public/product-categories/${encodeURIComponent(slug)}`)
  }

  productCollection(id: number | string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get(`/api/public/product-collection/${encodeURIComponent(String(id))}`)
  }

  // ── Eski içerik (canvas) ──────────────────────────────────────────────────

  /**
   * Canvas, v2 şema sisteminden önceki içerik modelidir. Yeni projelerde
   * `records()` kullanın; bunlar yalnızca eski siteler için ayakta.
   */
  readonly canvas = {
    list: (params: Record<string, unknown> = {}): Promise<ApiResponse<Array<Record<string, unknown>>>> =>
      this.client.get('/api/public/canvas', { params }),

    show: (slug: string): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.get(`/api/public/canvas/${encodeURIComponent(slug)}`),

    collection: (id: number | string): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.get(`/api/public/collection/${encodeURIComponent(String(id))}`),
  }

  // ── İletişim ──────────────────────────────────────────────────────────────

  /**
   * Mevcut bir ticket'a mesaj ekler.
   *
   * **Adı yanıltıcıdır ve sürüm uyumu için korunuyor:** bu uç form şeması
   * *dönmez*. Arkasındaki denetleyici `NotificationController@setTicketContent`,
   * yani yazma tarafıdır ve `ticket` ile `message` alanlarını zorunlu tutar.
   * Yeni ticket açmak için `submitTicket()` kullanın.
   *
   * @example
   *   await sdk.delivery.ticketForm({ ticket: 42, message: 'Ek bilgi: uçuşum ertelendi.' })
   */
  ticketForm(payload: TicketMessagePayload): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.post('/api/public/ticket-content', payload)
  }

  /**
   * Yeni iletişim/destek talebi açar.
   *
   * Zorunlu alanlar submit.api tarafından uygulanır; eksik gönderimde 422 döner
   * ve `errors` içinde alan adları listelenir. Onay alanları (`gdpr`,
   * `advertising`, `drp`) formda kullanıcıya sorulmalıdır — sunucu üçünü de bekler.
   *
   * @example
   *   await sdk.delivery.submitTicket({
   *     type: 'iletisim',
   *     subject: 'Ulaşım',
   *     message: 'Havalimanından transfer var mı?',
   *     user: 'guest',
   *     name: 'Deniz Aydın',
   *     email: 'deniz@example.com',
   *     gdpr: true,
   *     advertising: false,
   *     drp: true,
   *   })
   */
  submitTicket(payload: TicketPayload): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.post('/api/public/ticket-submit', payload)
  }

  notifications(token: string): Promise<ApiResponse<Array<Record<string, unknown>>>> {
    return this.client.get(`/api/public/notification/${encodeURIComponent(token)}`)
  }

  // ── Dokümanlar ────────────────────────────────────────────────────────────

  /** Yayımlanmış dokümanlar (katalog, kılavuz, PDF eki vb.). */
  readonly documents = {
    list: (params: Record<string, unknown> = {}): Promise<ApiResponse<Array<Record<string, unknown>>>> =>
      this.client.get('/api/documents', { params }),

    show: (slug: string): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.get(`/api/documents/${encodeURIComponent(slug)}`),

    collection: (id: number | string): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.get(`/api/documents/collection/${encodeURIComponent(String(id))}`),

    products: (params: Record<string, unknown> = {}): Promise<ApiResponse<Array<Record<string, unknown>>>> =>
      this.client.get('/api/documents/products', { params }),
  }

  // ── SEO / yapay zekâ keşfi ────────────────────────────────────────────────

  /**
   * Sitemap **adresi**. XML olduğu için SDK içeriği ayrıştırmaz — bu adresi
   * Search Console'a verin ya da `robots.txt`'e yazın.
   *
   * Token sorguda taşınır; böylece başlık ekleyemeyen araçlar da kullanabilir.
   */
  sitemapUrl(envToken: string): string {
    return `${this.client.baseUrl}/api/public/sitemap.xml?env=${encodeURIComponent(envToken)}`
  }

  /** Siteye özel, her zaman güncel entegrasyon rehberi (insan okur). */
  manifest(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get('/api/public/manifest')
  }

  /**
   * `llms.txt` — yapay zekâ araçlarının siteyi anlaması için düz metin.
   * JSON zarfına sarılmaz, string döner.
   */
  llmsTxt(): Promise<string> {
    return this.client.get<string>('/api/public/llms.txt')
  }
}
