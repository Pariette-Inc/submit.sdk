import { BaseModule } from './base'
import type { ApiResponse } from '../types/common'

/**
 * Yapay zekâ kredileri.
 *
 * Her AI çağrısı (metin iyileştirme, çeviri, SEO, görsel üretimi) kredi harcar.
 * Bakiye yetmezse ilgili uç 402 döner.
 */
export class AiModule extends BaseModule {
  /** Kalan kredi ve dönem bilgisi. */
  credits(): Promise<ApiResponse<{ balance: number } & Record<string, unknown>>> {
    return this.client.get('/api/ai/credits')
  }

  packages(): Promise<ApiResponse<Array<Record<string, unknown>>>> {
    return this.client.get('/api/ai/credits/packages')
  }

  purchase(packageId: number, payload: Record<string, unknown> = {}): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.post('/api/ai/credits/purchase', { package_id: packageId, ...payload })
  }

  /** Harcama geçmişi — hangi işlem ne kadar kredi yaktı. */
  transactions(params: Record<string, unknown> = {}): Promise<ApiResponse<Array<Record<string, unknown>>>> {
    return this.client.get('/api/ai/credits/transactions', { params })
  }

  /** Kullanılabilir görsel üretim modelleri ve kredi maliyetleri. */
  imageModels(): Promise<ApiResponse<Array<Record<string, unknown>>>> {
    return this.client.get('/api/schema/ai/image-models')
  }

  /** Görsel üretir ve site medyasına kaydeder. */
  generateImage(payload: { prompt: string; model?: string } & Record<string, unknown>): Promise<
    ApiResponse<Record<string, unknown>>
  > {
    return this.client.post('/api/schema/ai/image', payload)
  }
}

/**
 * Dosya yükleme.
 *
 * `File`/`Blob` verirseniz SDK `multipart/form-data` kurar. Node tarafında
 * `Buffer` yerine `Blob` ya da bir stream sarmalayıcı kullanın.
 *
 * @example
 *   const input = document.querySelector('input[type=file]')!
 *   await sdk.storage.uploadImage(input.files![0])
 */
export class StorageModule extends BaseModule {
  /** Tek görsel yükler. */
  uploadImage(file: File | Blob, extra: Record<string, string> = {}): Promise<ApiResponse<Record<string, unknown>>> {
    const form = new FormData()
    form.append('image', file)
    for (const [k, v] of Object.entries(extra)) form.append(k, v)
    return this.client.post('/api/storage-image', form)
  }

  /** Birden çok görseli tek istekte yükler. */
  uploadImages(files: Array<File | Blob>, extra: Record<string, string> = {}): Promise<
    ApiResponse<Array<Record<string, unknown>>>
  > {
    const form = new FormData()
    for (const f of files) form.append('images[]', f)
    for (const [k, v] of Object.entries(extra)) form.append(k, v)
    return this.client.post('/api/storage-images', form)
  }
}

/**
 * Ziyaretçi takibi ve hata bildirimi.
 *
 * Site token'ı yeter, oturum gerekmez. Yolculuk kayıtları panelde
 * Admin → Site Hareketleri ekranında görünür.
 */
export class TrackingModule extends BaseModule {
  /**
   * Ziyaretçi hareketi kaydeder (sayfa görüntüleme, tıklama, sepete ekleme…).
   * Sayfa kapanışında göndermek için `navigator.sendBeacon` tercih edin.
   */
  track(payload: Record<string, unknown>): Promise<ApiResponse<null>> {
    return this.client.post('/api/track', payload)
  }

  /** İstemci tarafı JS hatasını bildirir. */
  reportError(payload: Record<string, unknown>): Promise<ApiResponse<null>> {
    return this.client.post('/api/public/client-error', payload)
  }
}

/** Servis durumu. İzleme (uptime) kontrolleri için. */
export class SystemModule extends BaseModule {
  health(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get('/api/health')
  }
}
