import Foundation

/// İçerik kayıtları — v2 şema sisteminin ana modülü (yazma tarafı).
///
/// Ziyaretçiye içerik göstermek için `sdk.delivery` kullanın.
///
/// Gövde şeması:
/// ```swift
/// try await sdk.records.create("blog", payload: [
///     "data": ["baslik": "Merhaba"],   // tipin özel alanları
///     "status": "published",            // draft | published | archived
///     "locale": "tr",                   // sitenin dil listesinde olmalı
///     "categories": [3, 7],
///     "seo": ["meta_title": "..."],
///     "commerce": ["price": 199.90],    // yalnızca ürün tiplerinde
/// ])
/// ```
public struct RecordsModule: Sendable {
    let client: SubmitClient

    /// Kayıtları listeler. Filtre işleçleri: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `like`, `in`.
    ///
    /// ```swift
    /// try await sdk.records.list("urun", params: [
    ///     "status": "published",
    ///     "filter": ["price": ["gte": 100]],
    /// ])
    /// ```
    public func list(_ typeCode: String, params: [String: Any] = [:]) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/schema/records/\(esc(typeCode))", query: params, as: [JSONValue].self)
    }

    public func get(_ typeCode: String, id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/schema/records/\(esc(typeCode))/\(id)")
    }

    /// Yeni kayıt. Plan limiti burada uygulanır — kota dolduysa 403.
    public func create(_ typeCode: String, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/schema/records/\(esc(typeCode))", body: payload)
    }

    /// Kısmi güncelleme — yalnızca gönderdiğiniz alanlar değişir.
    public func update(_ typeCode: String, id: Int, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/schema/records/\(esc(typeCode))/\(id)", body: payload)
    }

    @discardableResult
    public func delete(_ typeCode: String, id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/schema/records/\(esc(typeCode))/\(id)")
    }

    public func analytics(_ typeCode: String, id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/schema/records/\(esc(typeCode))/\(id)/analytics")
    }

    public func revisions(_ typeCode: String, id: Int) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/schema/records/\(esc(typeCode))/\(id)/revisions", as: [JSONValue].self)
    }

    public func revision(_ typeCode: String, id: Int, version: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/schema/records/\(esc(typeCode))/\(id)/revisions/\(version)")
    }

    /// Kaydı o sürüme döndürür; mevcut hâl önce anlık görüntüye alınır.
    public func restoreRevision(_ typeCode: String, id: Int, version: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/schema/records/\(esc(typeCode))/\(id)/revisions/\(version)/restore")
    }

    public func gallery(_ typeCode: String, id: Int, field: String) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/schema/records/\(esc(typeCode))/\(id)/gallery/\(esc(field))", as: [JSONValue].self)
    }

    public func addGalleryImage(_ typeCode: String, id: Int, field: String, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/schema/records/\(esc(typeCode))/\(id)/gallery/\(esc(field))", body: payload)
    }

    /// Görsel sırasını topluca günceller — verilen id dizisi yeni sıradır.
    public func reorderGallery(_ typeCode: String, id: Int, field: String, order: [Int]) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/schema/records/\(esc(typeCode))/\(id)/gallery/\(esc(field))/order", body: ["order": order])
    }

    public func updateGalleryImage(_ typeCode: String, id: Int, field: String, imageId: Int, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/schema/records/\(esc(typeCode))/\(id)/gallery/\(esc(field))/\(imageId)", body: payload)
    }

    @discardableResult
    public func removeGalleryImage(_ typeCode: String, id: Int, field: String, imageId: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/schema/records/\(esc(typeCode))/\(id)/gallery/\(esc(field))/\(imageId)")
    }

    /// Metni iyileştirir. AI kredisi harcar — bakiye yetmezse 402.
    public func aiImprove(_ typeCode: String, id: Int, payload: [String: Any] = [:]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/schema/records/\(esc(typeCode))/\(id)/ai/improve", body: payload)
    }

    public func aiSeo(_ typeCode: String, id: Int, payload: [String: Any] = [:]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/schema/records/\(esc(typeCode))/\(id)/ai/seo", body: payload)
    }

    /// Kaydı hedef dile çevirip kardeş kayıt olarak bağlar.
    public func aiTranslate(_ typeCode: String, id: Int, locale: String) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/schema/records/\(esc(typeCode))/\(id)/ai/translate", body: ["locale": locale])
    }
}
