export interface Canvas {
  id: number
  title: string
  slug: string
  description?: string
  type?: string
  status: number
  environment_id: number
  user_id: number
  featured_image?: string
  template?: string
  created_at: string
  updated_at: string
  contents?: CanvasContent[]
  attributes?: CanvasAttribute[]
  galleries?: CanvasGallery[]
}

export interface CanvasContent {
  id: number
  canvas_id: number
  locale: string
  title?: string
  body?: string
  excerpt?: string
  meta_title?: string
  meta_description?: string
  created_at: string
  updated_at: string
}

export interface CanvasAttribute {
  id: number
  canvas_id: number
  key: string
  value: string
}

export interface CanvasGallery {
  id: number
  canvas_id: number
  image_id: number
  order: number
  image?: {
    id: number
    url: string
    alt?: string
  }
}

/**
 * Canvas + Content oluşturma isteği.
 * `/api/new-canvas` tek istekle hem canvas hem de içeriği oluşturur.
 *
 * title → canvas.title ve canvas.slug olarak kullanılır (slug belirtilmezse otomatik üretilir).
 */
export interface CreateCanvasRequest {
  // ── Canvas alanları ──────────────────────────────────────────────────────
  title: string
  type?: string           // canvas tipi ('content', 'blog', 'page' vb.) — varsayılan: 'content'
  status?: number         // 1 = yayında, 2 = taslak
  description?: string    // canvas kısa açıklaması
  featured_image?: string // öne çıkan görsel URL'si
  template?: string       // şablon adı
  order?: number          // sıralama
  slug?: string           // özel slug (belirtilmezse title'dan otomatik üretilir)
  release_at?: string     // yayın tarihi (ISO 8601)

  // ── Content alanları (ContentController::setContent'e iletilir) ──────────
  sub_title?: string               // alt başlık
  content?: string                 // ana içerik (HTML)
  keywords?: string | string[]     // SEO anahtar kelimeleri
  meta_title?: string              // SEO başlığı
  meta_description?: string        // SEO açıklaması
  canonical?: string               // canonical URL
  locale?: string                  // içerik dili (tr | en | de | fr)
}

export interface UpdateCanvasRequest {
  title?: string
  type?: string
  status?: number
  description?: string
  featured_image?: string
  template?: string
  order?: number
  slug?: string
  release_at?: string
}

/**
 * Kategori canvas'ı oluşturma isteği.
 * Kategori, type='category' olan özel bir canvas'tır.
 */
export interface CreateCategoryRequest {
  title: string           // kategori adı (slug otomatik üretilir)
  slug?: string           // özel slug
  description?: string    // kategori açıklaması
  status?: number         // 1 = yayında, 2 = taslak
  // İçerik alanları
  sub_title?: string
  content?: string
  keywords?: string | string[]
  meta_title?: string
  meta_description?: string
  canonical?: string
  locale?: string         // tr | en | de | fr
}

/**
 * Canvas'ı bir kategoriye bağlama isteği.
 * canvas_relations tablosuna kayıt oluşturur.
 */
export interface AddCanvasToCategoryRequest {
  canvas: number      // kategori canvas ID'si
  collection: number  // kategoriye eklenecek canvas ID'si
}

export interface CanvasRelationRequest {
  canvas: number
  collection: number
}

export interface CanvasGalleryRequest {
  canvas_id: number
  image_id: number
  order?: number
}
