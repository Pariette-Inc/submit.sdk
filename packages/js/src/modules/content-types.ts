import { BaseModule } from './base'
import type { ApiResponse } from '../types/common'

/**
 * İçerik tipinin türü.
 * - `content` — yazı, sayfa, duyuru gibi düz içerik
 * - `product` — ticaret alanları (fiyat, stok) açılır; `catalog` modülü gerekir
 */
export type ContentTypeKind = 'content' | 'product'

export interface FieldDefinition {
  /** Alan kodu — kayıt `data` nesnesindeki anahtar. */
  code: string
  label: string
  /** `sdk.schema.fieldTypes()` ile desteklenen tam liste alınır. */
  type: string
  required?: boolean
  unique?: boolean
  /** Seçim tipli alanlarda kullanılabilir değerler. */
  options?: Array<{ value: string; label: string }>
  /** Tipe özel ek ayarlar (min/max, kabul edilen dosya türü vb.). */
  settings?: Record<string, unknown>
}

export interface ContentType {
  id: number
  code: string
  label: string
  kind: ContentTypeKind
  version: number
  fields: FieldDefinition[]
  options?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ContentTypePayload {
  code?: string
  label: string
  kind?: ContentTypeKind
  fields: FieldDefinition[]
  /** `default_sort`, `default_sort_dir` gibi liste davranışı ayarları. */
  options?: Record<string, unknown>
}

/**
 * İçerik tipleri — sitenin veri şeması.
 *
 * Bir tip tanımlarsınız (örn. `blog`, alanları: başlık, görsel, içerik), sonra
 * `sdk.records` ile o tipte kayıt açarsınız. Şema değişiklikleri sürümlenir;
 * eski kayıtlar hangi sürümle yazıldıysa onu taşır.
 *
 * @example
 *   await sdk.contentTypes.create({
 *     code: 'blog',
 *     label: 'Blog Yazısı',
 *     kind: 'content',
 *     fields: [
 *       { code: 'baslik', label: 'Başlık', type: 'text', required: true },
 *       { code: 'icerik', label: 'İçerik', type: 'richtext' },
 *     ],
 *   })
 */
export class ContentTypeModule extends BaseModule {
  list(): Promise<ApiResponse<ContentType[]>> {
    return this.client.get('/api/schema/types')
  }

  get(code: string): Promise<ApiResponse<ContentType>> {
    return this.client.get(`/api/schema/types/${encodeURIComponent(code)}`)
  }

  create(payload: ContentTypePayload): Promise<ApiResponse<ContentType>> {
    return this.client.post('/api/schema/types', payload)
  }

  /**
   * Tipi günceller ve sürümü artırır.
   *
   * Alan silmek eski kayıtlardaki değerleri düşürür — önce
   * `revisions()` ile geçmişi kontrol etmek iyi fikirdir.
   */
  update(code: string, payload: Partial<ContentTypePayload>): Promise<ApiResponse<ContentType>> {
    return this.client.put(`/api/schema/types/${encodeURIComponent(code)}`, payload)
  }

  delete(code: string): Promise<ApiResponse<null>> {
    return this.client.delete(`/api/schema/types/${encodeURIComponent(code)}`)
  }

  /**
   * Tipin form tanımı — panelin kayıt formunu bu çıktıdan çizer.
   * Kendi arayüzünüzü kuruyorsanız alan sırası ve doğrulama kuralları burada.
   */
  form(code: string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get(`/api/schema/types/${encodeURIComponent(code)}/form`)
  }

  /** Şema sürüm geçmişi. */
  revisions(code: string): Promise<ApiResponse<Array<{ version: number; created_at: string }>>> {
    return this.client.get(`/api/schema/types/${encodeURIComponent(code)}/revisions`)
  }

  /**
   * Bu tipe özel, siteye göre kişiselleştirilmiş entegrasyon örnekleri
   * (cURL / SDK / fetch kod parçaları).
   */
  integration(code: string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get(`/api/schema/types/${encodeURIComponent(code)}/integration`)
  }

  /** Şemayı yapay zekâ ile üretir — doğal dille anlatın, alanları çıkarsın. */
  aiGenerate(code: string, payload: Record<string, unknown>): Promise<ApiResponse<ContentType>> {
    return this.client.post(`/api/schema/types/${encodeURIComponent(code)}/ai/generate`, payload)
  }
}

export interface RecordCategory {
  id: number
  name: string
  slug: string
  parent_id?: number | null
}

/** Kayıt kategorileri — ağaç yapısını `parent_id` kurar. */
export class CategoryModule extends BaseModule {
  list(): Promise<ApiResponse<RecordCategory[]>> {
    return this.client.get('/api/schema/categories')
  }

  create(payload: { name: string; slug?: string; parent_id?: number | null }): Promise<ApiResponse<RecordCategory>> {
    return this.client.post('/api/schema/categories', payload)
  }

  update(id: number, payload: Partial<{ name: string; slug: string; parent_id: number | null }>): Promise<
    ApiResponse<RecordCategory>
  > {
    return this.client.put(`/api/schema/categories/${id}`, payload)
  }

  delete(id: number): Promise<ApiResponse<null>> {
    return this.client.delete(`/api/schema/categories/${id}`)
  }
}

/**
 * Sitenin dilleri.
 *
 * Bir dil burada tanımlı değilse o dilde kayıt yazılamaz (422) — bu, panelde
 * hiç görünmeyen "hayalet" çevirileri engeller.
 */
export class LocaleModule extends BaseModule {
  list(): Promise<ApiResponse<Array<{ code: string; label?: string; is_default?: boolean }>>> {
    return this.client.get('/api/schema/locales')
  }

  add(code: string, payload?: Record<string, unknown>): Promise<ApiResponse<null>> {
    return this.client.post('/api/schema/locales', { code, ...payload })
  }

  remove(code: string): Promise<ApiResponse<null>> {
    return this.client.delete(`/api/schema/locales/${encodeURIComponent(code)}`)
  }
}

/** Şema sistemine dair yardımcı uçlar. */
export class SchemaModule extends BaseModule {
  /** Desteklenen alan tipleri ve her birinin ayar şeması. */
  fieldTypes(): Promise<ApiResponse<Array<{ type: string; label: string; settings?: Record<string, unknown> }>>> {
    return this.client.get('/api/schema/field-types')
  }

  /** Hazır şema şablonları (blog, ürün, portföy…) — tek tıkla tip kurmak için. */
  presets(): Promise<ApiResponse<Array<Record<string, unknown>>>> {
    return this.client.get('/api/schema/presets')
  }

  /** Sitede hangi modüller açık — ticaret, sipariş, AI vb. */
  modules(): Promise<ApiResponse<Record<string, boolean>>> {
    return this.client.get('/api/schema/modules')
  }

  /**
   * Site haritası özeti: yayımlanmış içerik sayıları ve sitemap.xml adresi.
   * Haritanın kendisi `sdk.delivery.sitemapUrl()` ile alınır.
   */
  sitemap(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get('/api/schema/sitemap')
  }
}
