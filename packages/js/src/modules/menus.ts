import { BaseModule } from './base'
import type { ApiResponse } from '../types/common'

export interface MenuItem {
  label: string
  /** Serbest bağlantı. `record`/`type` ile birlikte kullanılmaz. */
  url?: string
  /** İçerik tipi kodu — kaydın adresini backend çözer. */
  type?: string
  /** Kayıt id'si ya da slug'ı. */
  record?: number | string
  target?: '_self' | '_blank'
  /** Alt menü. Derinlik sınırı için `preview()` uyarı döner. */
  children?: MenuItem[]
  [key: string]: unknown
}

export interface Menu {
  id: number
  code: string
  label: string
  items: MenuItem[]
  version: number
  updated_at: string
}

/**
 * Menüler — site gezinmesi.
 *
 * Ağaç `items` içinde iç içe tutulur. Panelde yazarsınız, ziyaretçiye
 * `sdk.delivery.menu(code)` ile **çözülmüş** hâlini verirsiniz (bağlantı
 * hedefleri hesaplanmış, yayımlanmamış kayıtlar ayıklanmış olarak).
 *
 * @example
 *   await sdk.menus.update('ana-menu', {
 *     items: [
 *       { label: 'Anasayfa', url: '/' },
 *       { label: 'Blog', type: 'blog', children: [{ label: 'Tümü', url: '/blog' }] },
 *     ],
 *   })
 */
export class MenuModule extends BaseModule {
  list(): Promise<ApiResponse<Menu[]>> {
    return this.client.get('/api/menus')
  }

  get(code: string): Promise<ApiResponse<Menu>> {
    return this.client.get(`/api/menus/${encodeURIComponent(code)}`)
  }

  create(payload: { code: string; label: string; items?: MenuItem[] }): Promise<ApiResponse<Menu>> {
    return this.client.post('/api/menus', payload)
  }

  /** Menüyü günceller ve yeni bir sürüm yazar. */
  update(code: string, payload: Partial<{ label: string; items: MenuItem[] }>): Promise<ApiResponse<Menu>> {
    return this.client.put(`/api/menus/${encodeURIComponent(code)}`, payload)
  }

  delete(code: string): Promise<ApiResponse<null>> {
    return this.client.delete(`/api/menus/${encodeURIComponent(code)}`)
  }

  /**
   * Ağacı kaydetmeden çözer — kırık bağlantıları ve geçersiz derinliği
   * yayına almadan görmek için.
   */
  preview(code: string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get(`/api/menus/${encodeURIComponent(code)}/preview`)
  }

  revisions(code: string): Promise<ApiResponse<Array<{ version: number; created_at: string }>>> {
    return this.client.get(`/api/menus/${encodeURIComponent(code)}/revisions`)
  }

  restore(code: string, version: number): Promise<ApiResponse<Menu>> {
    return this.client.post(`/api/menus/${encodeURIComponent(code)}/restore/${version}`, {})
  }
}
