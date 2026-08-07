import { BaseModule } from './base'
import type { ApiResponse } from '../types/common'

/** Kayıt durumu — yayın akışını belirler. */
export type RecordStatus = 'draft' | 'published' | 'archived'

/** Alan filtrelerinde kullanılabilen karşılaştırma işleçleri. */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in'

export interface SeoPayload {
  /** En fazla 70 karakter. */
  meta_title?: string | null
  /** En fazla 320 karakter. */
  meta_description?: string | null
  /** En fazla 25 anahtar kelime, her biri 64 karakter. */
  keywords?: string[] | null
  canonical?: string | null
  og_image?: string | null
  noindex?: boolean | null
}

/**
 * Ticaret alanları. Yalnızca `kind: 'product'` tipindeki içeriklerde anlamlıdır
 * ve `catalog` modülü açık olmalıdır — kapalıysa yazma isteği 403 döner.
 */
export interface CommercePayload {
  sku?: string | null
  barcode?: string | null
  /** ISO 4217, 3 harf. Örn. `TRY`, `EUR`. */
  currency?: string | null
  price?: number | null
  cost_price?: number | null
  compare_at_price?: number | null
  /** Yüzde, 0–100. */
  tax_rate?: number | null
  price_includes_tax?: boolean | null
  stock?: number | null
  track_stock?: boolean | null
  allow_backorder?: boolean | null
  min_quantity?: number | null
  max_quantity?: number | null
  weight?: number | null
  shippable?: boolean | null
  purchasable?: boolean | null
}

export interface RecordPayload {
  /**
   * İçerik tipinde tanımlı özel alanların değerleri. Anahtarlar alan kodlarıdır.
   * Şemada olmayan anahtarlar sessizce atılır, tip uymazsa 422 döner.
   */
  data?: Record<string, unknown>
  status?: RecordStatus
  /** Sitenin dil listesinde bulunmalı — yoksa 422. `schema.locales.list()` ile bakın. */
  locale?: string | null
  /** Verilmezse başlıktan üretilir ve dil içinde tekilleştirilir. */
  slug?: string | null
  /** Aynı içeriğin farklı dillerdeki kardeşlerini bağlar. Verilmezse üretilir. */
  translation_key?: string | null
  published_at?: string | null
  /** Kategori id'leri. Yalnızca bu siteye ait olanlar bağlanır. */
  categories?: number[]
  seo?: SeoPayload | null
  commerce?: CommercePayload | null
}

export interface RecordListParams {
  page?: number
  /** 1–100 arası, varsayılan 20. Üstü sessizce 100'e kırpılır. */
  per_page?: number
  locale?: string
  status?: RecordStatus
  /** Tam metin arama — tipin metin alanlarında gezer. */
  q?: string
  /** Kategori slug'ı. Virgülle birden çok verilebilir: `'haber,duyuru'`. */
  category?: string
  /** Alan kodu ya da `created_at`. Verilmezse tipin varsayılanı. */
  sort?: string
  dir?: 'asc' | 'desc'
  /** Yalnızca ürün tiplerinde: stokta olanlar / olmayanlar. */
  in_stock?: boolean
  /**
   * Alan bazlı filtreler.
   *
   * @example
   *   { filter: { price: { gte: 100 }, brand: { in: 'apple,samsung' } } }
   */
  filter?: Record<string, Partial<Record<FilterOperator, unknown>>>
}

export interface SubmitRecord {
  id: number
  content_type_id: number
  slug: string | null
  locale: string | null
  translation_key: string | null
  status: RecordStatus
  data: Record<string, unknown>
  seo: SeoPayload | null
  commerce?: CommercePayload | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface PageMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

/**
 * İçerik kayıtları — v2 şema sisteminin ana modülü.
 *
 * Her kayıt bir **içerik tipine** (`typeCode`) bağlıdır; tipi
 * `sdk.contentTypes` ile yönetirsiniz. Bu modül panel/yazma tarafıdır ve
 * oturum ister. Siteye içerik **yayınlamak** için `sdk.delivery` kullanın —
 * o taraf yalnızca site token'ı ile çalışır ve sadece yayımlanmışları döner.
 *
 * @example
 *   const { data, meta } = await sdk.records.list('blog', {
 *     status: 'published',
 *     locale: 'tr',
 *     filter: { featured: { eq: true } },
 *     sort: 'published_at',
 *     dir: 'desc',
 *   })
 */
export class RecordModule extends BaseModule {
  /**
   * Kayıtları listeler. Sayfalama bilgisi yanıtın `meta` alanındadır.
   *
   * `filter` iç içe nesnedir ve sorgu dizesine `filter[alan][işleç]=değer`
   * biçiminde açılır.
   */
  list(
    typeCode: string,
    params: RecordListParams = {}
  ): Promise<ApiResponse<SubmitRecord[]> & { meta?: PageMeta }> {
    return this.client.get(`/api/schema/records/${encodeURIComponent(typeCode)}`, { params })
  }

  /** Tek kayıt — ilişkili kategoriler ve galeri alanları dahil döner. */
  get(typeCode: string, id: number): Promise<ApiResponse<SubmitRecord>> {
    return this.client.get(`/api/schema/records/${encodeURIComponent(typeCode)}/${id}`)
  }

  /**
   * Yeni kayıt.
   *
   * Plan limiti burada uygulanır: içerikler `record_limit`, ürünler
   * `product_limit` kotasına sayılır. Kota dolduysa 403 döner.
   */
  create(typeCode: string, payload: RecordPayload): Promise<ApiResponse<SubmitRecord>> {
    return this.client.post(`/api/schema/records/${encodeURIComponent(typeCode)}`, payload)
  }

  /** Kısmi güncelleme — yalnızca gönderdiğiniz alanlar değişir. */
  update(typeCode: string, id: number, payload: RecordPayload): Promise<ApiResponse<SubmitRecord>> {
    return this.client.put(`/api/schema/records/${encodeURIComponent(typeCode)}/${id}`, payload)
  }

  delete(typeCode: string, id: number): Promise<ApiResponse<null>> {
    return this.client.delete(`/api/schema/records/${encodeURIComponent(typeCode)}/${id}`)
  }

  /** Görüntülenme ve etkileşim özeti. */
  analytics(typeCode: string, id: number): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get(`/api/schema/records/${encodeURIComponent(typeCode)}/${id}/analytics`)
  }

  // ── Sürümler ──────────────────────────────────────────────────────────────

  /**
   * Sürüm geçmişi. Her kaydetmede anlık görüntü alınır.
   *
   * @example
   *   const { data } = await sdk.records.revisions.list('blog', 12)
   *   await sdk.records.revisions.restore('blog', 12, data[1].version)
   */
  readonly revisions = {
    list: (typeCode: string, id: number): Promise<ApiResponse<Array<{ version: number; created_at: string }>>> =>
      this.client.get(`/api/schema/records/${encodeURIComponent(typeCode)}/${id}/revisions`),

    get: (typeCode: string, id: number, version: number): Promise<ApiResponse<SubmitRecord>> =>
      this.client.get(`/api/schema/records/${encodeURIComponent(typeCode)}/${id}/revisions/${version}`),

    /** Kaydı o sürüme döndürür. Mevcut hâl önce anlık görüntüye alınır. */
    restore: (typeCode: string, id: number, version: number): Promise<ApiResponse<SubmitRecord>> =>
      this.client.post(
        `/api/schema/records/${encodeURIComponent(typeCode)}/${id}/revisions/${version}/restore`,
        {}
      ),
  }

  // ── Galeri alanları ───────────────────────────────────────────────────────

  /**
   * Bir kaydın galeri tipli alanını yönetir. `field` şemadaki alan kodudur.
   *
   * @example
   *   await sdk.records.gallery.add('urun', 7, 'fotograflar', { image_id: 42 })
   *   await sdk.records.gallery.reorder('urun', 7, 'fotograflar', [42, 41, 40])
   */
  readonly gallery = {
    list: (typeCode: string, id: number, field: string): Promise<ApiResponse<Array<Record<string, unknown>>>> =>
      this.client.get(
        `/api/schema/records/${encodeURIComponent(typeCode)}/${id}/gallery/${encodeURIComponent(field)}`
      ),

    add: (
      typeCode: string,
      id: number,
      field: string,
      payload: Record<string, unknown>
    ): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post(
        `/api/schema/records/${encodeURIComponent(typeCode)}/${id}/gallery/${encodeURIComponent(field)}`,
        payload
      ),

    /** Görsel sırasını topluca günceller — verilen id dizisi yeni sıradır. */
    reorder: (typeCode: string, id: number, field: string, order: number[]): Promise<ApiResponse<null>> =>
      this.client.put(
        `/api/schema/records/${encodeURIComponent(typeCode)}/${id}/gallery/${encodeURIComponent(field)}/order`,
        { order }
      ),

    /** Tek görselin başlık/alt metin gibi bilgilerini günceller. */
    update: (
      typeCode: string,
      id: number,
      field: string,
      imageId: number,
      payload: Record<string, unknown>
    ): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.put(
        `/api/schema/records/${encodeURIComponent(typeCode)}/${id}/gallery/${encodeURIComponent(field)}/${imageId}`,
        payload
      ),

    remove: (typeCode: string, id: number, field: string, imageId: number): Promise<ApiResponse<null>> =>
      this.client.delete(
        `/api/schema/records/${encodeURIComponent(typeCode)}/${id}/gallery/${encodeURIComponent(field)}/${imageId}`
      ),
  }

  // ── Yapay zekâ ────────────────────────────────────────────────────────────

  /**
   * Kayıt üzerinde AI işlemleri. Her çağrı AI kredisi harcar —
   * bakiye için `sdk.ai.credits()`, yetmezse 402 döner.
   */
  readonly ai = {
    /** Metni akıcılık/ton açısından iyileştirir. */
    improve: (typeCode: string, id: number, payload?: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post(`/api/schema/records/${encodeURIComponent(typeCode)}/${id}/ai/improve`, payload ?? {}),

    /** Meta başlık/açıklama ve anahtar kelime önerir. */
    seo: (typeCode: string, id: number, payload?: Record<string, unknown>): Promise<ApiResponse<SeoPayload>> =>
      this.client.post(`/api/schema/records/${encodeURIComponent(typeCode)}/${id}/ai/seo`, payload ?? {}),

    /** Kaydı hedef dile çevirip kardeş kayıt olarak bağlar. */
    translate: (
      typeCode: string,
      id: number,
      payload: { locale: string } & Record<string, unknown>
    ): Promise<ApiResponse<SubmitRecord>> =>
      this.client.post(`/api/schema/records/${encodeURIComponent(typeCode)}/${id}/ai/translate`, payload),
  }
}
