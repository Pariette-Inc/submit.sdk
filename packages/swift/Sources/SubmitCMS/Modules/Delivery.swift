import Foundation

/// Genel teslimat — ziyaretçiye gösterilen her şey.
///
/// Yalnızca site token'ı ister, oturum gerekmez. Sunucuda önbelleklenir ve
/// yalnızca yayımlanmış içeriği döner. Uygulamanızın içerik tarafı için gereken bu.
///
/// ```swift
/// let sdk = SubmitCMS(config: .init(token: "site_token"))
/// let posts = try await sdk.delivery.records("blog", params: ["per_page": 10])
/// ```
public struct DeliveryModule: Sendable {
    let client: SubmitClient

    public func records(_ typeCode: String, params: [String: Any] = [:]) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/public/records/\(esc(typeCode))", query: params, as: [JSONValue].self)
    }

    public func record(_ typeCode: String, slug: String, params: [String: Any] = [:]) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/public/records/\(esc(typeCode))/item/\(esc(slug))", query: params)
    }

    /// "Bunlar da ilginizi çekebilir" — ilgili kayıtlar.
    public func alsoRead(_ typeCode: String, slug: String) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/public/records/\(esc(typeCode))/item/\(esc(slug))/also-read", as: [JSONValue].self)
    }

    /// Görüntülenme kaydeder. `duration` saniye cinsinden okuma süresi.
    @discardableResult
    public func ping(_ typeCode: String, slug: String, duration: Int = 0) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/public/records/\(esc(typeCode))/item/\(esc(slug))/ping", body: ["duration": duration])
    }

    public func schema(_ typeCode: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/public/records/\(esc(typeCode))/schema")
    }

    public func categories() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/public/categories", as: [JSONValue].self)
    }

    public func category(_ slug: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/public/categories/\(esc(slug))")
    }

    /// Menüyü çözülmüş ağaç olarak döner.
    public func menu(_ code: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/public/menus/\(esc(code))")
    }

    /// Açılışta gereken her şey tek istekte: site bilgisi, tasarım, diller, menüler.
    public func initSite() async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/public/init")
    }

    public func environment(token: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/public/environment/\(esc(token))")
    }

    public func navigation(_ slug: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/public/navigation/\(esc(slug))")
    }

    public func banners() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/public/banners", as: [JSONValue].self)
    }

    public func gallery(_ slug: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/public/gallery/\(esc(slug))")
    }

    public func products(params: [String: Any] = [:]) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/public/products", query: params, as: [JSONValue].self)
    }

    public func product(_ slug: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/public/product/\(esc(slug))")
    }

    public func productCategory(_ slug: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/public/product-categories/\(esc(slug))")
    }

    public func productCollection(_ id: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/public/product-collection/\(esc(id))")
    }

    /// Canvas — v2 şemasından önceki içerik modeli. Yeni projelerde `records`
    /// kullanın; bunlar eski siteler için ayakta.
    public func canvasList(params: [String: Any] = [:]) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/public/canvas", query: params, as: [JSONValue].self)
    }

    public func canvas(_ slug: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/public/canvas/\(esc(slug))")
    }

    public func canvasCollection(_ id: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/public/collection/\(esc(id))")
    }

    public func documents(params: [String: Any] = [:]) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/documents", query: params, as: [JSONValue].self)
    }

    public func document(_ slug: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/documents/\(esc(slug))")
    }

    public func documentCollection(_ id: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/documents/collection/\(esc(id))")
    }

    public func documentProducts(params: [String: Any] = [:]) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/documents/products", query: params, as: [JSONValue].self)
    }

    /// Mevcut bir ticket'a mesaj ekler.
    ///
    /// Adı yanıltıcıdır ve sürüm uyumu için korunuyor: form şeması dönmez
    /// (`setTicketContent`); `ticket` ve `message` zorunludur. Yeni talep için
    /// `submitTicket` kullanın.
    public func ticketForm(_ payload: [String: Any] = [:]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/public/ticket-content", body: payload)
    }

    /// Yeni iletişim/destek talebi açar.
    ///
    /// Zorunlu alanlar: type, subject, user, name, email, gdpr, advertising, drp.
    public func submitTicket(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/public/ticket-submit", body: payload)
    }

    public func notifications(token: String) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/public/notification/\(esc(token))", as: [JSONValue].self)
    }

    /// Bu tarihler müsait mi, kaça? Oturum GEREKMEZ.
    ///
    /// Yanıt bilerek DARDIR: kalan kapasite ve kapasite tavanı DÖNMEZ ("3 oda
    /// kaldı" rakibin envanterini okuması demektir). `reason` reddin makine
    /// okunur gerekçesidir (`full`, `outside_season`, `too_soon`…), `message`
    /// ziyaretçiye gösterilecek metindir.
    public func reservationAvailability(_ typeCode: String, slug: String, params: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/public/reservations/\(esc(typeCode))/\(esc(slug))/availability", query: params)
    }

    /// Takvim: hangi günler müsait ve o günün fiyatı. Kalan adet dönmez.
    ///
    /// Gece sayan içeriklerde ÇIKIŞ GÜNÜ müsait görünür — 12'sinde öğlen çıkan
    /// misafir 12 gecesini tutmaz.
    public func reservationCalendar(_ typeCode: String, slug: String, params: [String: Any]) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/public/reservations/\(esc(typeCode))/\(esc(slug))/calendar", query: params, as: [JSONValue].self)
    }

    /// Rezervasyon talebi. Yalnız YAYIMLANMIŞ kayıtlar için çalışır.
    ///
    /// Çakışma ve kural ihlalleri 422 döner; `error.reason` hangi kuralın
    /// takıldığını söyler. Otomatik onay kapalıysa talep `pending` durumunda
    /// personelin önüne düşer. Dakikada en çok 10 istek.
    public func book(_ typeCode: String, slug: String, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/public/reservations/\(esc(typeCode))/\(esc(slug))", body: payload)
    }

    /// Sitemap adresi. XML olduğu için ayrıştırılmaz.
    public func sitemapURL(envToken: String) -> URL {
        var components = URLComponents(url: client.baseURL.appendingPathComponent("api/public/sitemap.xml"), resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "env", value: envToken)]
        return components.url!
    }

    /// Siteye özel, her zaman güncel entegrasyon rehberi.
    public func manifest() async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/public/manifest")
    }

    /// `llms.txt` — yapay zekâ araçları için düz metin (JSON zarfı yok).
    public func llmsTxt() async throws -> String {
        try await client.raw("/api/public/llms.txt")
    }
}
