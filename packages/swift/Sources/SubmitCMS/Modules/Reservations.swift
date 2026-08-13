import Foundation

/// Rezervasyon yönetimi (panel tarafı).
///
/// **Oturum ister** ve `reservations` modülü açık olmalıdır. Ziyaretçi tarafı
/// (müsaitlik sorgusu ve talep gönderme) oturumsuzdur ve `sdk.delivery`
/// altındadır: `reservationAvailability`, `reservationCalendar`, `book`.
///
/// Rezerve edilen şey bir KAYITTIR: otel odası, doktor, masa, tur — hepsi kendi
/// içerik tipinde birer kayıt. Bir kaydı rezervasyona AÇAN şey `saveSettings`
/// çağrısıdır; ayarı olmayan kayıtta müsaitlik `not_reservable` döner.
///
/// ```swift
/// try await sdk.reservations.saveSettings(recordId: 42, payload: [
///     "capacity": 3, "unit": "night", "min_units": 2,
///     "base_price": 1500, "auto_confirm": true,
/// ])
///
/// let bekleyen = try await sdk.reservations.list(params: ["status": "pending"])
/// ```
public struct ReservationsModule: Sendable {
    let client: SubmitClient

    /// Rezervasyon gelen kutusu. `meta.counts` durum başına sayaç taşır.
    ///
    /// Tarih filtresi aralıkla KESİŞENLERİ getirir: 1 Eylül sorgusu 28
    /// Ağustos'ta başlayan konaklamayı da bulur.
    ///
    /// Filtreler: `status`, `record_id`, `type`, `from`, `to`, `q`, `page`, `per_page`.
    public func list(params: [String: Any] = [:]) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/reservations", query: params, as: [JSONValue].self)
    }

    public func get(_ id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/reservations/\(id)")
    }

    /// Elle rezervasyon (telefonla gelen talep).
    ///
    /// Site formuyla AYNI kapıdan geçer: çakışan tarihler 422 ile reddedilir,
    /// gerekçe `errors` alanında insan diliyle döner.
    public func create(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/reservations", body: payload)
    }

    /// Durum değişikliği ve tarih taşıma.
    ///
    /// `starts_at` / `ends_at` / `quantity` gönderilirse çakışma kontrolü
    /// yeniden çalışır; kaydın KENDİ eski aralığı engel sayılmaz.
    ///
    /// İptal silme değildir: `["status": "cancelled"]` kaydı bırakır, yalnız
    /// kapasiteyi serbest eder.
    public func update(_ id: Int, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/reservations/\(id)", body: payload)
    }

    /// Rezervasyonu çöp kutusuna taşır (kayıtlarla aynı soft-delete kuralı).
    public func delete(_ id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/reservations/\(id)")
    }

    /// Doluluk takvimi — gün gün kalan kapasite ve o günün fiyatı.
    ///
    /// Gece sayan birimlerde ÇIKIŞ GÜNÜ boş görünür: 12'sinde öğlen çıkan
    /// misafir 12 gecesini tutmaz. Tek çağrıda en çok 120 gün döner.
    public func calendar(recordId: Int, from: String, to: String) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get(
            "/api/reservations/calendar",
            query: ["record_id": recordId, "from": from, "to": to],
            as: [JSONValue].self
        )
    }

    /// "Bu tarihlerde açık mı, kaça?" — yazmadan önce kontrol.
    public func check(params: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/reservations/check", query: params)
    }

    /// Sitedeki rezerve edilebilir kayıtlar.
    public func settings() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/reservations/settings", as: [JSONValue].self)
    }

    /// Kaydın ayarları + kapalı tarihleri + sezon fiyatları tek yanıtta.
    public func recordSettings(recordId: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/reservations/settings/\(recordId)")
    }

    /// Kur ya da güncelle — kaydı rezervasyona AÇAN çağrı budur.
    ///
    /// `unit`: `night` (otel), `day` (kiralama), `hour` (randevu).
    public func saveSettings(recordId: Int, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/reservations/settings/\(recordId)", body: payload)
    }

    /// Rezervasyona kapatır: yeni talep alınmaz, geçmiş kayıtlar durur.
    public func closeSettings(recordId: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/reservations/settings/\(recordId)")
    }

    /// Elle kapatma: bakım, tatil, özel kullanım. Rezervasyonla aynı şekilde
    /// kapasiteden düşer — tek fark, karşısında müşteri olmamasıdır.
    public func addBlock(recordId: Int, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/reservations/settings/\(recordId)/blocks", body: payload)
    }

    public func removeBlock(recordId: Int, blockId: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/reservations/settings/\(recordId)/blocks/\(blockId)")
    }

    /// Tarih aralığına özel fiyat. Kapsanmayan günler `base_price` ile
    /// hesaplanır; çakışan aralıklarda `priority` büyük olan kazanır.
    ///
    /// Fiyat rezervasyon yazılırken KOPYALANIR: tarifeyi sonradan değiştirmek
    /// eski rezervasyonların tutarını değiştirmez.
    public func addRate(recordId: Int, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/reservations/settings/\(recordId)/rates", body: payload)
    }

    public func removeRate(recordId: Int, rateId: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/reservations/settings/\(recordId)/rates/\(rateId)")
    }
}
