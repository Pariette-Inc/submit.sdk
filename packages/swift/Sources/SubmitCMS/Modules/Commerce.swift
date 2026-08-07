import Foundation

/// Ziyaretçi sepeti — mağaza önyüzü.
///
/// Oturum gerekmez; misafir sepeti `X-Guest-Id` ile taşınır
/// (`sdk.setGuestId(...)`). `ecommerce` modülü kapalıysa uçlar 403 döner.
public struct CartModule: Sendable {
    let client: SubmitClient

    public func get() async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/shop/cart")
    }

    public func add(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/shop/cart", body: payload)
    }

    /// Satır adedini değiştirir. `0` satırı silmez — `removeItem` kullanın.
    public func updateItem(itemId: Int, quantity: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/shop/cart/items/\(itemId)", body: ["quantity": quantity])
    }

    @discardableResult
    public func removeItem(itemId: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/shop/cart/items/\(itemId)")
    }

    @discardableResult
    public func clear() async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/shop/cart")
    }

    /// Sepeti siparişe çevirir; ödeme yönlendirmesi yanıtta döner.
    public func checkout(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/shop/checkout", body: payload)
    }
}

/// Eski sepet/checkout uçları (`/api/shopping/*`).
///
/// Yeni entegrasyonlarda `sdk.cart` kullanın. Kupon ve kargo seçenekleri şu an
/// yalnızca burada.
public struct ShoppingModule: Sendable {
    let client: SubmitClient

    public func cart() async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/shopping/cart")
    }

    public func addToCart(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/shopping/cart", body: payload)
    }

    public func updateCartItem(itemId: Int, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/shopping/cart/\(itemId)", body: payload)
    }

    @discardableResult
    public func removeCartItem(itemId: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/shopping/cart/\(itemId)")
    }

    @discardableResult
    public func clearCart() async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/shopping/cart/clear")
    }

    public func checkout(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/shopping/checkout", body: payload)
    }

    /// Ödeme ve teslimat seçenekleri.
    public func checkoutOptions() async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/shopping/checkout/options")
    }

    /// Kupon uygular ve yeni toplamı döner.
    public func applyCoupon(code: String) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/shopping/checkout/coupon", body: ["code": code])
    }

    public func carriers() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/shopping/carriers", as: [JSONValue].self)
    }
}

/// Sipariş yönetimi (satıcı tarafı). `orders` modülü açık olmalı.
public struct OrdersModule: Sendable {
    let client: SubmitClient

    public func list(params: [String: Any] = [:]) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/commerce/orders", query: params, as: [JSONValue].self)
    }

    public func get(id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/commerce/orders/\(id)")
    }

    public func update(id: Int, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/commerce/orders/\(id)", body: payload)
    }

    /// Durum geçişi. Geçersiz geçişler 422 döner.
    public func updateStatus(id: Int, status: String) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/commerce/orders/\(id)/status", body: ["status": status])
    }

    public func cancel(id: Int, payload: [String: Any] = [:]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/commerce/orders/\(id)/cancel", body: payload)
    }

    /// Satış raporu — ciro, adet, dönem kırılımı.
    public func report(params: [String: Any] = [:]) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/commerce/orders/report", query: params)
    }

    public func createInvoice(orderId: Int, payload: [String: Any] = [:]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/commerce/orders/\(orderId)/invoice", body: payload)
    }

    public func invoice(orderId: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/commerce/orders/\(orderId)/invoice")
    }

    public func mailSettings() async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/commerce/orders/mail-settings")
    }

    public func updateMailSettings(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/commerce/orders/mail-settings", body: payload)
    }
}

/// Müşterinin kendi siparişleri.
public struct CustomerOrdersModule: Sendable {
    let client: SubmitClient

    public func list(params: [String: Any] = [:]) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/my-orders", query: params, as: [JSONValue].self)
    }

    public func get(id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/my-orders/\(id)")
    }

    public func cancel(id: Int, payload: [String: Any] = [:]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/my-orders/\(id)/cancel", body: payload)
    }

    /// Satıcıya sipariş üzerinden mesaj yazar.
    public func message(id: Int, message: String) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/my-orders/\(id)/message", body: ["message": message])
    }
}

/// Kullanıcı adresleri.
public struct AddressesModule: Sendable {
    let client: SubmitClient

    public func list() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/user/addresses", as: [JSONValue].self)
    }

    public func create(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/user/addresses", body: payload)
    }

    public func update(id: Int, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/user/addresses/\(id)", body: payload)
    }

    @discardableResult
    public func delete(id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.delete("/api/user/addresses/\(id)")
    }
}

/// Ödemeler. Stripe/Tami webhook uçları sunucu-sunucudur, SDK'da yer almaz.
public struct PaymentsModule: Sendable {
    let client: SubmitClient

    public func list(params: [String: Any] = [:]) async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/payments", query: params, as: [JSONValue].self)
    }

    public func get(id: Int) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/payments/\(id)")
    }

    public func create(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/payments", body: payload)
    }

    /// Stripe PaymentIntent açar — `client_secret` ile Stripe SDK'sına devredin.
    public func createStripeIntent(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/payments/stripe/create-intent", body: payload)
    }
}

/// Abonelik ve fatura profilleri (SaaS tarafı).
public struct BillingModule: Sendable {
    let client: SubmitClient

    public func subscriptions() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/user/subscriptions", as: [JSONValue].self)
    }

    /// Satın almadan önce vergi dahil tutarı hesaplatır.
    public func calculatePricing(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/user/calculate-pricing", body: payload)
    }

    public func subscribe(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/user/subscribe", body: payload)
    }

    public func profiles() async throws -> SubmitResponse<[JSONValue]> {
        try await client.get("/api/user/billing-profiles", as: [JSONValue].self)
    }

    public func createProfile(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/user/billing-profiles", body: payload)
    }

    public func updateProfile(id: Int, payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/user/billing-profiles/\(id)", body: payload)
    }
}
