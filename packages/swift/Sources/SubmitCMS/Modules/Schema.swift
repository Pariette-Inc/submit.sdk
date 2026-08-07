import Foundation

/// İçerik tipleri — sitenin veri şeması.
///
/// Önce tip tanımlarsınız, sonra `sdk.records` ile o tipte kayıt açarsınız.
/// Şema değişiklikleri sürümlenir.
public struct ContentTypesModule: Sendable {
    let client: SubmitClient

    public func list() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/schema/types", as: [JSONValue].self)
    }

    public func get(_ code: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/schema/types/\(esc(code))")
    }

    public func create(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/schema/types", body: payload)
    }

    /// Tipi günceller ve sürümü artırır. Alan silmek eski kayıtlardaki
    /// değerleri düşürür.
    public func update(_ code: String, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/schema/types/\(esc(code))", body: payload)
    }

    @discardableResult
    public func delete(_ code: String) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/schema/types/\(esc(code))")
    }

    /// Panelin kayıt formunu çizdiği tanım — kendi arayüzünüz için.
    public func form(_ code: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/schema/types/\(esc(code))/form")
    }

    public func revisions(_ code: String) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/schema/types/\(esc(code))/revisions", as: [JSONValue].self)
    }

    /// Bu tipe özel, siteye göre kişiselleştirilmiş entegrasyon örnekleri.
    public func integration(_ code: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/schema/types/\(esc(code))/integration")
    }

    /// Şemayı yapay zekâ ile üretir.
    public func aiGenerate(_ code: String, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/schema/types/\(esc(code))/ai/generate", body: payload)
    }
}

/// Kayıt kategorileri — ağacı `parent_id` kurar.
public struct CategoriesModule: Sendable {
    let client: SubmitClient

    public func list() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/schema/categories", as: [JSONValue].self)
    }

    public func create(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/schema/categories", body: payload)
    }

    public func update(id: Int, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/schema/categories/\(id)", body: payload)
    }

    @discardableResult
    public func delete(id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/schema/categories/\(id)")
    }
}

/// Sitenin dilleri.
///
/// Burada tanımlı olmayan bir dile kayıt yazılamaz (422) — bu, panelde hiç
/// görünmeyen "hayalet" çevirileri engeller.
public struct LocalesModule: Sendable {
    let client: SubmitClient

    public func list() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/schema/locales", as: [JSONValue].self)
    }

    public func add(code: String) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/schema/locales", body: ["code": code])
    }

    @discardableResult
    public func remove(code: String) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/schema/locales/\(esc(code))")
    }
}

/// Şema sistemine dair yardımcı uçlar.
public struct SchemaModule: Sendable {
    let client: SubmitClient

    /// Desteklenen alan tipleri ve ayar şemaları.
    public func fieldTypes() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/schema/field-types", as: [JSONValue].self)
    }

    /// Hazır şema şablonları.
    public func presets() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/schema/presets", as: [JSONValue].self)
    }

    /// Sitede hangi modüller açık.
    public func modules() async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/schema/modules")
    }

    /// Site haritası özeti.
    public func sitemap() async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/schema/sitemap")
    }
}

/// Menüler — site gezinmesi.
///
/// Ağaç `items` içinde iç içe tutulur. Ziyaretçiye çözülmüş hâlini
/// `sdk.delivery.menu(code)` ile verin.
public struct MenusModule: Sendable {
    let client: SubmitClient

    public func list() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/menus", as: [JSONValue].self)
    }

    public func get(_ code: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/menus/\(esc(code))")
    }

    public func create(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/menus", body: payload)
    }

    public func update(_ code: String, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/menus/\(esc(code))", body: payload)
    }

    @discardableResult
    public func delete(_ code: String) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/menus/\(esc(code))")
    }

    /// Ağacı kaydetmeden çözer — kırık bağlantıları yayına almadan görmek için.
    public func preview(_ code: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/menus/\(esc(code))/preview")
    }

    public func revisions(_ code: String) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/menus/\(esc(code))/revisions", as: [JSONValue].self)
    }

    public func restore(_ code: String, version: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/menus/\(esc(code))/restore/\(version)")
    }
}
