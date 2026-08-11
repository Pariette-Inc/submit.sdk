import { SubmitClient, SubmitClientConfig } from './client'
import { AuthModule } from './modules/auth'
import { RecordModule } from './modules/records'
import { ContentTypeModule, CategoryModule, LocaleModule, SchemaModule } from './modules/content-types'
import { MenuModule } from './modules/menus'
import { DeliveryModule } from './modules/delivery'
import {
  CartModule,
  LegacyShoppingModule,
  OrderModule,
  CustomerOrderModule,
  AddressModule,
  PaymentModule,
  BillingModule,
} from './modules/commerce'
import { PlatformModule, PartnerModule } from './modules/platform'
import { AiModule, StorageModule, TrackingModule, SystemModule } from './modules/misc'

/**
 * SubmitCMS SDK giriş noktası.
 *
 * ```ts
 * import { SubmitCms } from 'submitcms'
 *
 * const sdk = new SubmitCms({
 *   mode: 'production',
 *   token: process.env.SUBMIT_TOKEN!,
 *   locale: 'tr',
 * })
 *
 * // Ziyaretçiye içerik — oturum gerekmez
 * const { data } = await sdk.delivery.records('blog', { per_page: 10 })
 *
 * // Panel işlemleri — önce giriş
 * await sdk.auth.login({ email, password })
 * await sdk.records.create('blog', { data: { baslik: 'Merhaba' }, status: 'published' })
 * ```
 *
 * **Hangi modülü ne zaman:**
 *
 * | Ne yapıyorsunuz | Modül | Kimlik |
 * |---|---|---|
 * | Site önyüzü, içerik gösterme | `delivery` | site token'ı |
 * | İçerik yazma/düzenleme | `records`, `contentTypes`, `menus` | token + oturum |
 * | Mağaza sepeti | `cart` | site token'ı |
 * | Sipariş yönetimi | `orders` | token + oturum + `orders` modülü |
 * | Müşteri kendi sitesini yönetiyor | `platform` | token + oturum + üyelik |
 * | Bayi paneli | `partner` | partner oturumu |
 */
export class SubmitCms {
  /** Alt seviye HTTP istemcisi — başlık, event ve iptal denetimi için. */
  readonly client: SubmitClient

  /** Kimlik doğrulama, hesap, 2FA, davet. */
  readonly auth: AuthModule
  /** Ziyaretçiye açık teslimat — içerik, katalog, menü, site bilgisi. */
  readonly delivery: DeliveryModule

  /** İçerik kayıtları (yazma tarafı). */
  readonly records: RecordModule
  /** İçerik tipleri — sitenin veri şeması. */
  readonly contentTypes: ContentTypeModule
  /** Kayıt kategorileri. */
  readonly categories: CategoryModule
  /** Sitenin dilleri. */
  readonly locales: LocaleModule
  /** Şema yardımcıları: alan tipleri, hazır şablonlar, açık modüller, sitemap. */
  readonly schema: SchemaModule
  /** Menüler. */
  readonly menus: MenuModule

  /** Ziyaretçi sepeti ve checkout. */
  readonly cart: CartModule
  /** Eski `/api/shopping/*` sepet uçları — kupon ve kargo şu an burada. */
  readonly shopping: LegacyShoppingModule
  /** Sipariş yönetimi (satıcı). */
  readonly orders: OrderModule
  /** Müşterinin kendi siparişleri. */
  readonly myOrders: CustomerOrderModule
  /** Kullanıcı adresleri. */
  readonly addresses: AddressModule
  /** Ödemeler. */
  readonly payments: PaymentModule
  /** Abonelik ve fatura profilleri. */
  readonly billing: BillingModule

  /** Müşterinin self-servis site yönetimi. */
  readonly platform: PlatformModule
  /** Bayi/ajans paneli. */
  readonly partner: PartnerModule

  /** Yapay zekâ kredileri ve görsel üretimi. */
  readonly ai: AiModule
  /** Dosya yükleme. */
  readonly storage: StorageModule
  /** Ziyaretçi takibi ve hata bildirimi. */
  readonly tracking: TrackingModule
  /** Servis durumu. */
  readonly system: SystemModule

  constructor(config: SubmitClientConfig) {
    this.client = new SubmitClient(config)

    this.auth = new AuthModule(this.client)
    this.delivery = new DeliveryModule(this.client)

    this.records = new RecordModule(this.client)
    this.contentTypes = new ContentTypeModule(this.client)
    this.categories = new CategoryModule(this.client)
    this.locales = new LocaleModule(this.client)
    this.schema = new SchemaModule(this.client)
    this.menus = new MenuModule(this.client)

    this.cart = new CartModule(this.client)
    this.shopping = new LegacyShoppingModule(this.client)
    this.orders = new OrderModule(this.client)
    this.myOrders = new CustomerOrderModule(this.client)
    this.addresses = new AddressModule(this.client)
    this.payments = new PaymentModule(this.client)
    this.billing = new BillingModule(this.client)

    this.platform = new PlatformModule(this.client)
    this.partner = new PartnerModule(this.client)

    this.ai = new AiModule(this.client)
    this.storage = new StorageModule(this.client)
    this.tracking = new TrackingModule(this.client)
    this.system = new SystemModule(this.client)
  }

  /** Oturum token'ını elle yazar — sunucu tarafında saklanan JWT'yi geri yüklerken. */
  setAuthToken(token: string | null): void {
    this.client.setAuthToken(token)
  }

  /** Aktif siteyi değiştirir (`EnvToken`). Çok siteli panellerde kullanılır. */
  setEnvironment(token: string | null): void {
    this.client.setEnvironment(token)
  }

  /** İstek dilini değiştirir. */
  setLocale(locale: string): void {
    this.client.setLocale(locale)
  }

  /** Misafir sepeti kimliği. */
  setGuestId(guestId: string | null): void {
    this.client.setGuestId(guestId)
  }
}
