import Foundation

/// Müşterinin kendi sitesini yönettiği self-servis uçlar (`platform/my`).
/// Site üyeliği zorunlu.
public struct PlatformModule: Sendable {
    let client: SubmitClient

    /// Plan, kota kullanımı ve site durumu.
    public func overview() async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/platform/my/overview")
    }

    public func analytics(params: [String: Any] = [:]) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/platform/my/analytics", query: params)
    }

    public func payments(params: [String: Any] = [:]) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/platform/my/payments", query: params, as: [JSONValue].self)
    }

    public func receipts() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/platform/my/receipts", as: [JSONValue].self)
    }

    /// PDF indirme adresi — ikili veri döndürülmez.
    public func receiptPDFURL(id: Int) -> URL {
        client.baseURL.appendingPathComponent("api/platform/my/receipts/\(id)/pdf")
    }

    public func modules() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/platform/my/modules", as: [JSONValue].self)
    }

    /// Modülü satın alır; ödeme gerekiyorsa yanıtta yönlendirme döner.
    public func purchaseModule(code: String, payload: [String: Any] = [:]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/platform/my/modules/\(esc(code))/purchase", body: payload)
    }

    public func domains() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/platform/my/domains", as: [JSONValue].self)
    }

    /// Özel alan adı ekler. Dönen TXT kaydını DNS'e ekleyip `verifyDomain`
    /// çağırın; kayıt `_submit.<alan adı>` altında aranır.
    public func addDomain(_ domain: String) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/platform/my/domains", body: ["domain": domain])
    }

    public func verifyDomain(id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/platform/my/domains/\(id)/verify")
    }

    @discardableResult
    public func removeDomain(id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/platform/my/domains/\(id)")
    }

    public func team() async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/platform/my/team")
    }

    public func inviteTeamMember(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/platform/my/team/invite", body: payload)
    }

    @discardableResult
    public func cancelInvitation(id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/platform/my/team/invitations/\(id)")
    }

    @discardableResult
    public func removeTeamMember(id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/platform/my/team/members/\(id)")
    }

    /// Herkese açık paket listesi — fiyatlandırma ekranı için.
    public func plans() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/platform/plans", as: [JSONValue].self)
    }

    /// Ödeme bağlantısı — oturum gerekmez.
    public func payLink(token: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/platform/pay/\(esc(token))")
    }

    public func payByCard(token: String, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/platform/pay/\(esc(token))/card", body: payload)
    }

    public func payByBankTransfer(token: String, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/platform/pay/\(esc(token))/bank-transfer", body: payload)
    }

    /// Whitelabel partner açılış sayfası.
    public func partnerSite(slug: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/platform/site/\(esc(slug))")
    }

    public func buyPackage(slug: String, packageId: Int, payload: [String: Any] = [:]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/platform/site/\(esc(slug))/packages/\(packageId)/buy", body: payload)
    }
}

/// Partner paneli — bayi/ajans tarafı. Partner rolündeki oturum ister.
public struct PartnerModule: Sendable {
    let client: SubmitClient

    public func dashboard() async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/platform/partner/dashboard")
    }

    public func settings() async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/platform/partner/settings")
    }

    public func updateSettings(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/platform/partner/settings", body: payload)
    }

    public func modules() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/platform/partner/modules", as: [JSONValue].self)
    }

    public func customers(params: [String: Any] = [:]) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/platform/partner/customers", query: params, as: [JSONValue].self)
    }

    public func customer(id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/platform/partner/customers/\(id)")
    }

    /// Müşteriye özel fiyat tanımlar.
    public func setCustomerPrices(id: Int, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/platform/partner/customers/\(id)/prices", body: payload)
    }

    public func packages() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/platform/partner/packages", as: [JSONValue].self)
    }

    public func createPackage(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/platform/partner/packages", body: payload)
    }

    public func updatePackage(id: Int, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/platform/partner/packages/\(id)", body: payload)
    }

    @discardableResult
    public func deletePackage(id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/platform/partner/packages/\(id)")
    }

    /// Ödeme bağlantıları — müşteriye gönderilen tek kullanımlık tahsilat linki.
    public func checkoutLinks() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/platform/partner/checkout-links", as: [JSONValue].self)
    }

    public func createCheckoutLink(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/platform/partner/checkout-links", body: payload)
    }

    public func sendCheckoutLink(id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/platform/partner/checkout-links/\(id)/send")
    }

    public func cancelCheckoutLink(id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/platform/partner/checkout-links/\(id)/cancel")
    }

    public func gateways() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/platform/partner/gateways", as: [JSONValue].self)
    }

    public func createGateway(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/platform/partner/gateways", body: payload)
    }

    public func updateGateway(id: Int, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/platform/partner/gateways/\(id)", body: payload)
    }

    @discardableResult
    public func deleteGateway(id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/platform/partner/gateways/\(id)")
    }

    /// Anahtarları test eder.
    public func verifyGateway(id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/platform/partner/gateways/\(id)/verify")
    }

    public func bankTransfers() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/platform/partner/bank-transfers", as: [JSONValue].self)
    }

    /// Havale bildirimini onaylar ya da reddeder.
    public func reviewBankTransfer(id: Int, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/platform/partner/bank-transfers/\(id)/review", body: payload)
    }

    public func transfers() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/platform/partner/transfers", as: [JSONValue].self)
    }

    public func createTransfer(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/platform/partner/transfers", body: payload)
    }

    public func respondTransfer(id: Int, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/platform/partner/transfers/\(id)/respond", body: payload)
    }

    public func receiptPDFURL(id: Int) -> URL {
        client.baseURL.appendingPathComponent("api/platform/partner/receipts/\(id)/pdf")
    }
}
