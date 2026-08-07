import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios'
import {
  SubmitConfig,
  API_URLS,
  ApiResponse,
  SubmitError,
  ENV_HEADER,
  ENV_OVERRIDE_HEADER,
} from './types/common'
import { getMockResponse, MockRequest } from './mock'

// ── SDK Event System ──────────────────────────────────────────────────────────

/**
 * SDK tarafından fırlatılan event tipleri.
 * Dış uygulamalar bu event'lere abone olarak auth durumu, hata ve
 * ağ bağlantısı değişikliklerini dinleyebilir.
 *
 * @example
 *   submitcms.on('auth:expired', () => router.push('/login'))
 *   submitcms.on('error:rate-limit', ({ retryAfter }) => showToast(`${retryAfter}s bekleyin`))
 */
export type SubmitEvent =
  | 'auth:expired'
  | 'auth:refreshed'
  | 'error:network'
  | 'error:server'
  | 'error:rate-limit'
  | 'request:start'
  | 'request:end'

export type SubmitEventPayload = {
  'auth:expired': undefined
  /** Token'ın ilk 8 karakteri maskelenmiş olarak gönderilir (güvenlik) */
  'auth:refreshed': { tokenPreview: string }
  'error:network': { message: string }
  'error:server': { status: number; message: string }
  'error:rate-limit': { retryAfter: number }
  'request:start': { url: string; method: string }
  'request:end': { url: string; method: string; duration: number; status: number }
}

type EventHandler<E extends SubmitEvent> = (payload: SubmitEventPayload[E]) => void

// ── Retry Configuration ───────────────────────────────────────────────────────

/**
 * İstek tekrarlama (retry) yapılandırması.
 * Ağ hataları ve 5xx sunucu hataları için exponential backoff ile yeniden dener.
 */
export interface RetryConfig {
  /** Maksimum tekrar sayısı (varsayılan: 3) */
  maxRetries: number
  /** İlk bekleme süresi ms (varsayılan: 1000) — her tekrarda 2x artar */
  baseDelay: number
  /** Maksimum bekleme süresi ms (varsayılan: 10000) */
  maxDelay: number
  /** Hangi HTTP status kodlarında tekrar denenecek */
  retryableStatuses: number[]
}

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  // 429 buradan ÇIKARILDI — rate-limit durumunda retry-after header'ına
  // saygı duyulmalı, exponential backoff değil sunucunun söylediği süre beklenmeli.
  // 429 için özel davranış response interceptor'da ele alınır.
  retryableStatuses: [408, 500, 502, 503, 504],
}

// ── Extended Config ───────────────────────────────────────────────────────────

/**
 * Geliştirilmiş SDK yapılandırması.
 * Temel SubmitConfig'e ek olarak retry, debug ve token yenileme
 * callback'leri barındırır.
 *
 * @example
 *   const sdk = new SubmitClient({
 *     mode: 'production',
 *     token: 'env_xxxxx',
 *     locale: 'tr',
 *     retry: { maxRetries: 2 },
 *     onTokenRefresh: async () => {
 *       const { token } = await refreshFromServer()
 *       return token
 *     },
 *   })
 */
export interface SubmitClientConfig extends SubmitConfig {
  /** İstek tekrarlama ayarları (false = devre dışı) */
  retry?: Partial<RetryConfig> | false
  /** Debug modu — tüm istekleri console'a loglar */
  debug?: boolean
  /**
   * JWT süresi dolduğunda çağrılır.
   * Yeni bir access_token döndürmeli; null dönerse auth:expired event'i fırlatılır.
   */
  onTokenRefresh?: () => Promise<string | null>
  /**
   * Mock modu — gerçek HTTP isteği yapmaz, fixture response döner.
   * Test ve storybook senaryoları içindir.
   *
   * @example
   *   const sdk = new SubmitCms({ mode: 'test', token: 't', mock: true })
   *   await sdk.products.list()  // → fixture döner, network'e gitmez
   */
  mock?: boolean
}

// ── Request Queue (Token Refresh) ─────────────────────────────────────────────

interface QueuedRequest {
  resolve: (token: string) => void
  reject: (error: Error) => void
}

// ── Main Client ───────────────────────────────────────────────────────────────

/**
 * SubmitCms HTTP istemcisi — tüm SDK modülleri bu sınıf üzerinden API'ye erişir.
 *
 * **Özellikler:**
 * - Otomatik JWT yenileme (401 → refresh → retry)
 * - Exponential backoff ile retry (ağ/5xx hataları)
 * - Event sistemi (auth:expired, error:network vb.)
 * - İstek/yanıt loglama (debug modu)
 * - Request deduplication (aynı GET'i paralel çağırmayı önler)
 * - Tam TypeScript tip güvenliği — `any` kullanılmaz
 *
 * @example
 *   const client = new SubmitClient({
 *     mode: 'production',
 *     token: 'env_token_here',
 *     locale: 'tr',
 *   })
 *   const products = await client.get<ApiResponse<Product[]>>('/shopping/products')
 */
/** 429 retry üst sınırı — Retry-After'a saygı duyularak max bu kadar denenir */
const MAX_429_RETRIES = 3

export class SubmitClient {
  private http: AxiosInstance
  private authToken: string | null = null
  private retryConfig: RetryConfig | null
  private debugMode: boolean
  private mockMode: boolean
  private onTokenRefresh: (() => Promise<string | null>) | null

  // ── Token refresh queue ──
  private isRefreshing = false
  private refreshQueue: QueuedRequest[] = []

  // ── Event system ──
  private listeners: Map<SubmitEvent, Set<EventHandler<SubmitEvent>>> = new Map()

  // ── GET deduplication ──
  private inflightGets: Map<string, Promise<AxiosResponse>> = new Map()

  constructor(private config: SubmitClientConfig) {
    const baseURL = config.baseUrl ?? API_URLS[config.mode]
    this.debugMode = config.debug ?? false
    this.mockMode = config.mock ?? false
    this.onTokenRefresh = config.onTokenRefresh ?? null
    this.retryConfig =
      config.retry === false ? null : { ...DEFAULT_RETRY, ...(config.retry ?? {}) }

    this.http = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        [ENV_HEADER]: config.token,
        ...(config.locale ? { Locale: config.locale } : {}),
      },
      timeout: config.timeout || 30000,
    })

    this.setupRequestInterceptor()
    this.setupResponseInterceptor()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERCEPTORS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Request interceptor:
   * - Otomatik Authorization header ekleme
   * - Debug loglama
   * - Request timing başlatma
   */
  private setupRequestInterceptor(): void {
    this.http.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Timing metadata
        ;(config as InternalAxiosRequestConfig & { metadata: { startTime: number } }).metadata = {
          startTime: Date.now(),
        }

        // Auth header — her istekte güncel token kullanılır
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`
        }

        // Debug logging
        if (this.debugMode) {
          const method = (config.method ?? 'GET').toUpperCase()
          console.log(`[SubmitCms SDK] → ${method} ${config.baseURL}${config.url}`)
        }

        // Event
        this.emit('request:start', {
          url: config.url ?? '',
          method: (config.method ?? 'GET').toUpperCase(),
        })

        return config
      },
      (error: AxiosError) => Promise.reject(error)
    )
  }

  /**
   * Response interceptor:
   * - 401 yakalama → otomatik token refresh → başarısız istekleri yeniden kuyruklama
   * - 429 yakalama → rate-limit event
   * - Hata normalize etme → SubmitError
   * - Debug loglama ve timing
   */
  private setupResponseInterceptor(): void {
    this.http.interceptors.response.use(
      (response: AxiosResponse) => {
        this.logTiming(response.config, response.status)
        return response
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as
          | (InternalAxiosRequestConfig & {
              _retryCount?: number
              _isRetry?: boolean
              _retry429Count?: number
            })
          | undefined

        if (!originalRequest) {
          throw this.normalizeError(error)
        }

        const status = error.response?.status

        // ── 401 — Token Expired → Refresh ──
        if (status === 401 && !originalRequest._isRetry && this.onTokenRefresh) {
          originalRequest._isRetry = true

          if (this.isRefreshing) {
            // Zaten refresh yapılıyor — kuyruğa ekle
            return new Promise<AxiosResponse>((resolve, reject) => {
              this.refreshQueue.push({
                resolve: (newToken: string) => {
                  originalRequest.headers.Authorization = `Bearer ${newToken}`
                  resolve(this.http(originalRequest))
                },
                reject,
              })
            })
          }

          this.isRefreshing = true

          try {
            const newToken = await this.onTokenRefresh()

            if (!newToken) {
              this.emit('auth:expired', undefined)
              this.drainQueue(new Error('Token refresh returned null'))
              throw this.normalizeError(error)
            }

            this.setAuthToken(newToken)
            // Token'ı event'e TAM olarak göndermiyoruz — 3rd-party listener riski
            this.emit('auth:refreshed', {
              tokenPreview: `${newToken.substring(0, 8)}...`,
            })

            // Kuyrukta bekleyen istekleri yeni token ile çalıştır
            this.refreshQueue.forEach((q) => q.resolve(newToken))
            this.refreshQueue = []

            // Orijinal isteği yeniden dene
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return this.http(originalRequest)
          } catch (refreshError) {
            this.emit('auth:expired', undefined)
            this.drainQueue(
              refreshError instanceof Error ? refreshError : new Error('Token refresh failed')
            )
            throw this.normalizeError(error)
          } finally {
            this.isRefreshing = false
          }
        }

        // ── 429 — Rate Limited → Retry-After'a saygı duyup yeniden dene ──
        if (status === 429) {
          const retryAfter = parseInt(
            (error.response?.headers?.['retry-after'] as string) || '60',
            10
          )
          this.emit('error:rate-limit', { retryAfter })

          const count = originalRequest._retry429Count ?? 0
          if (count < MAX_429_RETRIES) {
            originalRequest._retry429Count = count + 1
            const waitMs = Math.max(0, retryAfter) * 1000

            if (this.debugMode) {
              console.log(
                `[SubmitCms SDK] 429 — retrying after ${retryAfter}s (${count + 1}/${MAX_429_RETRIES})`
              )
            }

            await this.sleep(waitMs)
            return this.http(originalRequest)
          }
        }

        // ── Network Error ──
        if (!error.response) {
          this.emit('error:network', { message: error.message })
        }

        // ── 5xx — Server Error ──
        if (status && status >= 500) {
          this.emit('error:server', {
            status,
            message: (error.response?.data as Record<string, string>)?.message ?? error.message,
          })
        }

        throw this.normalizeError(error)
      }
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RETRY LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  /** İdempotent olmayan HTTP metodları — bu metodlarda retry yapılmaz */
  private static NON_IDEMPOTENT_METHODS = new Set(['post'])

  /**
   * Exponential backoff ile isteği tekrar dener.
   * Jitter eklenerek thundering-herd problemi önlenir.
   *
   * **GÜVENLİK:** POST istekleri varsayılan olarak retry EDİLMEZ
   * çünkü idempotent değildir (aynı sipariş/ödeme tekrar oluşabilir).
   * Sadece ağ hataları (sunucuya hiç ulaşamama) durumunda retry yapılır.
   *
   * @param requestFn - Çalıştırılacak istek fonksiyonu
   * @param method - HTTP metodu (retry kararı için)
   */
  private async retryRequest<T>(requestFn: () => Promise<T>, method = 'get'): Promise<T> {
    if (!this.retryConfig) return requestFn()

    // POST/PATCH gibi non-idempotent metodlarda retry YAPMA
    // (sunucuya ulaşıp response alamama durumu hariç — o zaman bile riskli)
    if (SubmitClient.NON_IDEMPOTENT_METHODS.has(method.toLowerCase())) {
      return requestFn()
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await requestFn()
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))

        const isRetryable =
          err instanceof SubmitError
            ? this.retryConfig.retryableStatuses.includes(err.code)
            : (err as AxiosError).code === 'ECONNABORTED' ||
              (err as AxiosError).code === 'ERR_NETWORK'

        if (!isRetryable || attempt === this.retryConfig.maxRetries) {
          throw lastError
        }

        // Exponential backoff with jitter
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, attempt) + Math.random() * 500,
          this.retryConfig.maxDelay
        )

        if (this.debugMode) {
          console.log(
            `[SubmitCms SDK] Retry ${attempt + 1}/${this.retryConfig.maxRetries} in ${Math.round(delay)}ms`
          )
        }

        await this.sleep(delay)
      }
    }

    throw lastError ?? new Error('Retry exhausted')
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API — HTTP Methods
  // ═══════════════════════════════════════════════════════════════════════════

  /** JWT token set/clear — auth modülü login/logout'ta otomatik çağırır */
  setAuthToken(token: string | null): void {
    this.authToken = token
    if (token) {
      this.http.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete this.http.defaults.headers.common['Authorization']
    }
  }

  getAuthToken(): string | null {
    return this.authToken
  }

  /**
   * İsteklerin gittiği API kökü (host, sonunda `/` yok).
   *
   * Tarayıcı yönlendirmesiyle yürüyen akışlarda gerekir — Google OAuth gibi
   * XHR ile çağrılamayan uçların tam adresini kurmak için.
   */
  get baseUrl(): string {
    return (this.http.defaults.baseURL ?? '').replace(/\/$/, '')
  }

  /**
   * Aktif siteyi değiştir — `EnvToken` başlığını basar.
   *
   * Kullanıcının birden çok siteye eriştiği panel senaryosu içindir: yapılandırmadaki
   * `token` sabit kalır, istekler seçili siteye gider. Backend `EnvToken`'ı
   * `SubmitToken`'dan ÖNCE okuduğu için bu çağrı yapılandırmayı ezer.
   *
   * `null` verilirse yapılandırmadaki token'a geri dönülür.
   *
   * @example
   *   const sites = await sdk.auth.myEnvironments()
   *   sdk.setEnvironment(sites.data[0].token)
   *   await sdk.records.list('blog')   // artık o siteye gider
   */
  setEnvironment(token: string | null): void {
    if (token) {
      this.http.defaults.headers.common[ENV_OVERRIDE_HEADER] = token
    } else {
      delete this.http.defaults.headers.common[ENV_OVERRIDE_HEADER]
    }
  }

  /**
   * X-Guest-Id — misafir sepet işlemleri için session ID.
   * Misafir müşteri checkout akışında cart endpoint'lerine gönderilir.
   *
   * @example
   *   sdk.setGuestId(sessionStorage.getItem('guest_id'))
   */
  setGuestId(guestId: string | null): void {
    if (guestId) {
      this.http.defaults.headers.common['X-Guest-Id'] = guestId
    } else {
      delete this.http.defaults.headers.common['X-Guest-Id']
    }
  }

  /** İstek locale'ini güncelle (tr | en | de | fr) */
  setLocale(locale: string): void {
    this.http.defaults.headers.common['Locale'] = locale
  }

  /**
   * GET isteği — retry ve deduplication destekli. `signal` ile iptal edilebilir.
   *
   * @typeParam T - Beklenen yanıt tipi
   * @param url - API endpoint yolu (ör. '/shopping/products')
   * @param params - Query parametreleri
   * @param signal - İptal sinyali (AbortController.signal)
   * @returns API yanıtı
   *
   * @example
   *   const ctrl = new AbortController()
   *   const res = await client.get<ApiResponse<Product[]>>('/shopping/products', { page: 1 }, ctrl.signal)
   *   // ctrl.abort() ile isteği iptal edebilirsin
   */
  async get<T>(
    url: string,
    params?: Record<string, unknown> | object,
    signal?: AbortSignal
  ): Promise<T> {
    if (this.mockMode) return this.mockResponse<T>('GET', url, undefined, params)

    const cacheKey = `${url}:${JSON.stringify(params ?? {})}`

    // GET deduplication — aynı isteği paralel çağırmayı önle
    // signal varsa dedup atlanır — iptal başka istekleri etkilememeli
    if (!signal) {
      const inflight = this.inflightGets.get(cacheKey)
      if (inflight) {
        const response = await inflight
        return response.data as T
      }
    }

    const requestPromise = this.retryRequest(
      () => this.http.get<T>(url, { params, signal }),
      'get'
    )
      .then((response) => response as unknown as AxiosResponse)
      .finally(() => {
        if (!signal) this.inflightGets.delete(cacheKey)
      })

    if (!signal) this.inflightGets.set(cacheKey, requestPromise)

    const response = await requestPromise
    return response.data as T
  }

  /** POST isteği — retry destekli, AbortSignal ile iptal edilebilir. */
  async post<T>(
    url: string,
    data?: Record<string, unknown> | object,
    signal?: AbortSignal
  ): Promise<T> {
    if (this.mockMode) return this.mockResponse<T>('POST', url, data)
    return this.retryRequest(async () => {
      const response = await this.http.post<T>(url, data, { signal })
      return response.data
    }, 'post')
  }

  /** PUT isteği — tam kaynak güncelleme. */
  async put<T>(
    url: string,
    data?: Record<string, unknown> | object,
    signal?: AbortSignal
  ): Promise<T> {
    if (this.mockMode) return this.mockResponse<T>('PUT', url, data)
    return this.retryRequest(async () => {
      const response = await this.http.put<T>(url, data, { signal })
      return response.data
    }, 'put')
  }

  /** PATCH isteği — kısmi kaynak güncelleme. */
  async patch<T>(
    url: string,
    data?: Record<string, unknown> | object,
    signal?: AbortSignal
  ): Promise<T> {
    if (this.mockMode) return this.mockResponse<T>('PATCH', url, data)
    return this.retryRequest(async () => {
      const response = await this.http.patch<T>(url, data, { signal })
      return response.data
    }, 'patch')
  }

  /** DELETE isteği. */
  async delete<T>(
    url: string,
    params?: Record<string, unknown> | object,
    signal?: AbortSignal
  ): Promise<T> {
    if (this.mockMode) return this.mockResponse<T>('DELETE', url, undefined, params)
    return this.retryRequest(async () => {
      const response = await this.http.delete<T>(url, { params, signal })
      return response.data
    }, 'delete')
  }

  /**
   * Tek dosya yükleme — ilerleme callback destekli.
   *
   * @typeParam T - Beklenen yanıt tipi
   * @param url - Upload endpoint
   * @param file - Yüklenecek dosya (File | Blob)
   * @param fieldName - Form field adı (varsayılan: 'file')
   * @param extraFields - Ek form alanları
   * @param onProgress - Yükleme ilerleme callback'i (0-100)
   *
   * @example
   *   await client.upload<ApiResponse<StorageImage>>(
   *     '/files/upload',
   *     imageFile,
   *     'file',
   *     { folder: 'products' },
   *     (pct) => console.log(`${pct}%`)
   *   )
   */
  async upload<T>(
    url: string,
    file: File | Blob,
    fieldName = 'file',
    extraFields?: Record<string, string | number | boolean>,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    if (this.mockMode) return this.mockResponse<T>('POST', url, { file: '<mock>', ...extraFields })

    const formData = new FormData()
    formData.append(fieldName, file)

    if (extraFields) {
      Object.entries(extraFields).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }

    const requestConfig: AxiosRequestConfig = {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...(onProgress
        ? {
            onUploadProgress: (e) => {
              if (e.total) onProgress(Math.round((e.loaded * 100) / e.total))
            },
          }
        : {}),
    }

    const response = await this.http.post<T>(url, formData, requestConfig)
    return response.data
  }

  /**
   * Çoklu dosya yükleme — batch upload destekli.
   *
   * @typeParam T - Beklenen yanıt tipi
   * @param url - Upload endpoint
   * @param files - Yüklenecek dosyalar
   * @param fieldName - Form field adı (varsayılan: 'files[]')
   * @param extraFields - Ek form alanları
   * @param onProgress - Yükleme ilerleme callback'i (0-100)
   */
  async uploadMultiple<T>(
    url: string,
    files: Array<File | Blob>,
    fieldName = 'files[]',
    extraFields?: Record<string, string | number | boolean>,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    if (this.mockMode)
      return this.mockResponse<T>('POST', url, { files: `<mock x${files.length}>`, ...extraFields })

    const formData = new FormData()
    files.forEach((file) => formData.append(fieldName, file))

    if (extraFields) {
      Object.entries(extraFields).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }

    const requestConfig: AxiosRequestConfig = {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...(onProgress
        ? {
            onUploadProgress: (e) => {
              if (e.total) onProgress(Math.round((e.loaded * 100) / e.total))
            },
          }
        : {}),
    }

    const response = await this.http.post<T>(url, formData, requestConfig)
    return response.data
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Event dinleyici ekler. Birden fazla dinleyici eklenebilir.
   *
   * @param event - Dinlenecek event tipi
   * @param handler - Event handler fonksiyonu
   * @returns Aboneliği iptal eden fonksiyon
   *
   * @example
   *   const unsub = client.on('auth:expired', () => {
   *     router.push('/login')
   *   })
   *   // Temizlik: unsub()
   */
  on<E extends SubmitEvent>(event: E, handler: EventHandler<E>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler as EventHandler<SubmitEvent>)

    // Unsubscribe fonksiyonu döndür
    return () => {
      this.listeners.get(event)?.delete(handler as EventHandler<SubmitEvent>)
    }
  }

  /**
   * Event dinleyicisini kaldırır.
   */
  off<E extends SubmitEvent>(event: E, handler: EventHandler<E>): void {
    this.listeners.get(event)?.delete(handler as EventHandler<SubmitEvent>)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private emit<E extends SubmitEvent>(event: E, payload: SubmitEventPayload[E]): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        ;(handler as EventHandler<E>)(payload)
      } catch (err) {
        console.error(`[SubmitCms SDK] Event handler error (${event}):`, err)
      }
    })
  }

  private normalizeError(error: AxiosError): SubmitError {
    if (error.response) {
      const data = error.response.data as Record<string, unknown> | undefined
      return new SubmitError(
        (data?.['message'] as string) ?? error.message,
        error.response.status,
        data?.['errors'] as Record<string, string[]> | undefined
      )
    }

    // Network error (no response)
    return new SubmitError(
      error.code === 'ECONNABORTED'
        ? 'Request timeout — sunucu yanıt vermedi'
        : `Network error — ${error.message}`,
      0
    )
  }

  private drainQueue(error: Error): void {
    this.refreshQueue.forEach((q) => q.reject(error))
    this.refreshQueue = []
  }

  private logTiming(config: InternalAxiosRequestConfig, status: number): void {
    const meta = config as InternalAxiosRequestConfig & { metadata?: { startTime: number } }
    const duration = meta.metadata ? Date.now() - meta.metadata.startTime : 0

    if (this.debugMode) {
      const method = (config.method ?? 'GET').toUpperCase()
      console.log(`[SubmitCms SDK] ← ${status} ${method} ${config.url} (${duration}ms)`)
    }

    this.emit('request:end', {
      url: config.url ?? '',
      method: (config.method ?? 'GET').toUpperCase(),
      duration,
      status,
    })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Mock modu için response üretir — fixture'dan eşleşeni döner.
   * Network'e gitmez, debug log + event'leri yine emit eder ki
   * test ortamı gerçek davranışa benzesin.
   */
  private mockResponse<T>(
    method: MockRequest['method'],
    url: string,
    body?: unknown,
    params?: unknown
  ): T {
    if (this.debugMode) {
      console.log(`[SubmitCms SDK] [MOCK] ${method} ${url}`)
    }
    this.emit('request:start', { url, method })
    const data = getMockResponse({ method, url, body, params }) as T
    this.emit('request:end', { url, method, duration: 0, status: 200 })
    return data
  }
}
