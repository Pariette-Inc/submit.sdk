import Foundation

/// Destek talepleri gelen kutusu — sitenin iletişim/destek formlarına düşenler.
///
/// OKUMA tarafıdır ve **oturum ister**: site token'ı tek başına yetmez, kullanıcı
/// o sitenin üyesi olmalı ve `tickets` modülü açık olmalıdır. Talebi oluşturan
/// taraf ziyaretçidir ve oturumsuzdur — bunun için `sdk.delivery.submitTicket()`
/// ve `sdk.delivery.ticketForm()` vardır.
public struct TicketsModule: Sendable {
    let client: SubmitClient

    /// Sayfalı gelen kutusu; yanıt `meta` (sayfalama) ve `stats` de taşır.
    ///
    /// Filtreler: `search`, `type`, `subject`, `status`, `start`, `end`,
    /// `page`, `per_page`.
    public func list(params: [String: Any] = [:]) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/tickets", query: params, as: [JSONValue].self)
    }

    /// Tek talep: gövde + yazışma + onaylar (KVKK/ticari ileti/veri işleme) + IP.
    public func get(_ id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/tickets/\(id)")
    }

    /// Filtre için talep türleri: tanımlı konular + gelen kutusunda geçen türler.
    /// Gönderene giden otomatik yanıt şablonları (`...Return`) listede yer almaz.
    public func subjects() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/tickets/subjects", as: [JSONValue].self)
    }
}
