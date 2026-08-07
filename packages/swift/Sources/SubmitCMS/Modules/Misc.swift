import Foundation

/// Yapay zekâ kredileri. Her AI çağrısı kredi harcar; bakiye yetmezse 402.
public struct AiModule: Sendable {
    let client: SubmitClient

    public func credits() async throws -> SubmitResponse<JSONValue> { try await client.get("/api/ai/credits") }

    public func packages() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/ai/credits/packages", as: [JSONValue].self)
    }

    public func purchase(packageId: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/ai/credits/purchase", body: ["package_id": packageId])
    }

    /// Harcama geçmişi — hangi işlem ne kadar kredi yaktı.
    public func transactions(params: [String: Any] = [:]) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/ai/credits/transactions", query: params, as: [JSONValue].self)
    }

    /// Kullanılabilir görsel modelleri ve kredi maliyetleri.
    public func imageModels() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/schema/ai/image-models", as: [JSONValue].self)
    }

    /// Görsel üretir ve site medyasına kaydeder.
    public func generateImage(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/schema/ai/image", body: payload)
    }
}

/// Dosya yükleme.
public struct StorageModule: Sendable {
    let client: SubmitClient

    /// Tek görsel yükler.
    public func uploadImage(data: Data, filename: String, mimeType: String = "image/jpeg") async throws
        -> SubmitResponse<JSONValue>
    {
        try await client.upload(
            "/api/storage-image",
            files: [(name: "image", filename: filename, mimeType: mimeType, data: data)]
        )
    }

    /// Birden çok görseli tek istekte yükler.
    public func uploadImages(_ files: [(filename: String, mimeType: String, data: Data)]) async throws
        -> SubmitResponse<[JSONValue]>
    {
        try await client.upload(
            "/api/storage-images",
            files: files.map { (name: "images[]", filename: $0.filename, mimeType: $0.mimeType, data: $0.data) },
            as: [JSONValue].self
        )
    }
}

/// Ziyaretçi takibi ve hata bildirimi. Site token'ı yeter.
public struct TrackingModule: Sendable {
    let client: SubmitClient

    @discardableResult
    public func track(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/track", body: payload)
    }

    @discardableResult
    public func reportError(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/public/client-error", body: payload)
    }
}

/// Servis durumu — uptime kontrolleri için.
public struct SystemModule: Sendable {
    let client: SubmitClient

    public func health() async throws -> SubmitResponse<JSONValue> { try await client.get("/api/health") }
}
