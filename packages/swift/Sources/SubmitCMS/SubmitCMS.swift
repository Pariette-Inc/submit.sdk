import Foundation

/// SubmitCMS SDK giriş noktası.
///
/// ```swift
/// import SubmitCMS
///
/// let sdk = SubmitCMS(config: .init(
///     mode: .production,
///     token: ProcessInfo.processInfo.environment["SUBMIT_TOKEN"]!,
///     locale: "tr"
/// ))
///
/// // Ziyaretçiye içerik — oturum gerekmez
/// let posts = try await sdk.delivery.records("blog", params: ["per_page": 10])
///
/// // Panel işlemleri — önce giriş
/// try await sdk.auth.console(email: "admin@site.com", password: "parola")
/// try await sdk.records.create("blog", payload: [
///     "data": ["baslik": "Merhaba"],
///     "status": "published",
/// ])
/// ```
///
/// Hangi modülü ne zaman:
///
/// | Ne yapıyorsunuz | Modül | Kimlik |
/// |---|---|---|
/// | Uygulamada içerik gösterme | `delivery` | site token'ı |
/// | İçerik yazma | `records`, `contentTypes`, `menus` | token + oturum |
/// | Mağaza sepeti | `cart` | site token'ı |
/// | Sipariş yönetimi | `orders` | token + oturum + `orders` modülü |
/// | Müşteri kendi sitesini yönetiyor | `platform` | token + oturum + üyelik |
/// | Bayi paneli | `partner` | partner oturumu |
public struct SubmitCMS: Sendable {
    /// Alt seviye HTTP istemcisi — başlık ve oturum denetimi için.
    public let client: SubmitClient

    public let auth: AuthModule
    public let delivery: DeliveryModule

    public let records: RecordsModule
    public let contentTypes: ContentTypesModule
    public let categories: CategoriesModule
    public let locales: LocalesModule
    public let schema: SchemaModule
    public let menus: MenusModule
    /// Destek talepleri gelen kutusu (panel tarafı; gönderim `delivery`de).
    public let tickets: TicketsModule

    public let cart: CartModule
    public let shopping: ShoppingModule
    public let orders: OrdersModule
    public let myOrders: CustomerOrdersModule
    public let addresses: AddressesModule
    public let payments: PaymentsModule
    public let billing: BillingModule

    public let platform: PlatformModule
    public let partner: PartnerModule

    public let ai: AiModule
    public let storage: StorageModule
    public let tracking: TrackingModule
    public let system: SystemModule

    public init(config: SubmitConfig, session: URLSession = .shared) {
        self.init(client: SubmitClient(config: config, session: session))
    }

    public init(client: SubmitClient) {
        self.client = client

        auth = AuthModule(client: client)
        delivery = DeliveryModule(client: client)

        records = RecordsModule(client: client)
        contentTypes = ContentTypesModule(client: client)
        categories = CategoriesModule(client: client)
        locales = LocalesModule(client: client)
        schema = SchemaModule(client: client)
        menus = MenusModule(client: client)
        tickets = TicketsModule(client: client)

        cart = CartModule(client: client)
        shopping = ShoppingModule(client: client)
        orders = OrdersModule(client: client)
        myOrders = CustomerOrdersModule(client: client)
        addresses = AddressesModule(client: client)
        payments = PaymentsModule(client: client)
        billing = BillingModule(client: client)

        platform = PlatformModule(client: client)
        partner = PartnerModule(client: client)

        ai = AiModule(client: client)
        storage = StorageModule(client: client)
        tracking = TrackingModule(client: client)
        system = SystemModule(client: client)
    }

    /// Oturum token'ını elle yazar — saklanan JWT'yi geri yüklerken.
    public func setAuthToken(_ token: String?) async {
        await client.setAuthToken(token)
    }

    /// Aktif siteyi değiştirir (`EnvToken`). Çok siteli uygulamalarda.
    public func setEnvironment(_ token: String?) async {
        await client.setEnvironment(token)
    }

    public func setLocale(_ locale: String) async {
        await client.setLocale(locale)
    }

    /// Misafir sepeti kimliği.
    public func setGuestId(_ guestId: String?) async {
        await client.setGuestId(guestId)
    }
}
