import { BaseModule } from './base'
import type { ApiResponse } from '../types/common'
import type { RecordListParams, SubmitRecord, PageMeta } from './records'

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

  /** İletişim formu alanlarını döner — formu şemadan çizmek için. */
  ticketForm(payload: Record<string, unknown> = {}): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.post('/api/public/ticket-content', payload)
  }

  /** İletişim/destek formunu gönderir. */
  submitTicket(payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
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
