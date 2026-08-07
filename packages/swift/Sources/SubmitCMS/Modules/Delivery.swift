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

    public func ticketForm(_ payload: [String: Any] = [:]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/public/ticket-content", body: payload)
    }

    public func submitTicket(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/public/ticket-submit", body: payload)
    }

    public func notifications(token: String) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/public/notification/\(esc(token))", as: [JSONValue].self)
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
