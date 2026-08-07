/**
 * SDK temel yapılandırma ayarları.
 *
 * @example
 *   const sdk = new SubmitCms({
 *     mode: 'production',
 *     token: 'env_xxxxx',
 *     locale: 'tr',
 *     timeout: 15000,
 *   })
 */
export interface SubmitConfig {
  /** API ortamı — production veya test sunucusu. `baseUrl` verilirse yok sayılır. */
  mode: 'production' | 'test'
  /**
   * Site token'ı — `SubmitToken` başlığıyla gönderilir ve multi-tenant izolasyonunu sağlar.
   * Panelde site adı, konsolda "Entegrasyon" sekmesinde görünür.
   */
  token: string
  /** Varsayılan istek dili (tr | en | de | fr) */
  locale?: string
  /** İstek zaman aşımı (ms, varsayılan: 30000) */
  timeout?: number
  /**
   * API kökünü elle ver — yerel geliştirme veya self-hosted kurulum için.
   * Örn. `http://localhost:8000`. Verilirse `mode` yok sayılır.
   */
  baseUrl?: string
}

export const API_URLS = {
  production: 'https://live.submitcms.com',
  test: 'https://dev.submitcms.com',
} as const

/**
 * Backend'in site kimliğini çözme sırası (`SubmitCms::myenv`):
 *
 *   1. `?env=` sorgu parametresi
 *   2. `token` (sorgu ya da gövde)
 *   3. `EnvToken` başlığı
 *   4. `SubmitToken` başlığı
 *
 * SDK varsayılan olarak `SubmitToken` gönderir. Panel gibi kullanıcının birden çok
 * site arasında geçiş yaptığı uygulamalarda `client.setEnvironment(token)` ile
 * `EnvToken` basılır — daha yüksek önceliklidir ve yapılandırmadaki token'ı ezer.
 */
export const ENV_HEADER = 'SubmitToken' as const
export const ENV_OVERRIDE_HEADER = 'EnvToken' as const

export interface ApiResponse<T = unknown> {
  status: boolean
  statusText?: string
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T = unknown> {
  status: boolean
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ListParams {
  page?: number
  per_page?: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  [key: string]: unknown
}

export class SubmitError extends Error {
  constructor(
    message: string,
    public code: number,
    public errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'SubmitError'
  }
}
