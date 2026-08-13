package com.submitcms.sdk.modules

import com.submitcms.sdk.SubmitClient
import kotlinx.serialization.json.JsonObject

/**
 * Ziyaretçi sepeti — mağaza önyüzü.
 *
 * Oturum gerekmez; misafir sepeti `X-Guest-Id` ile taşınır
 * (`sdk.setGuestId(...)`). `ecommerce` modülü kapalıysa uçlar 403 döner.
 */
class Cart(private val client: SubmitClient) {
    suspend fun get(): JsonObject = client.get("/api/shop/cart")

    suspend fun add(payload: Map<String, Any?>): JsonObject = client.post("/api/shop/cart", payload)

    /** Satır adedini değiştirir. `0` satırı silmez — [removeItem] kullanın. */
    suspend fun updateItem(itemId: Int, quantity: Int): JsonObject =
        client.put("/api/shop/cart/items/$itemId", mapOf("quantity" to quantity))

    suspend fun removeItem(itemId: Int): JsonObject = client.delete("/api/shop/cart/items/$itemId")

    suspend fun clear(): JsonObject = client.delete("/api/shop/cart")

    /** Sepeti siparişe çevirir; ödeme yönlendirmesi yanıtta döner. */
    suspend fun checkout(payload: Map<String, Any?>): JsonObject = client.post("/api/shop/checkout", payload)
}

/**
 * Eski sepet/checkout uçları (`/api/shopping/*`).
 *
 * Yeni entegrasyonlarda [Cart] kullanın. Kupon ve kargo seçenekleri şu an
 * yalnızca burada.
 */
class Shopping(private val client: SubmitClient) {
    suspend fun cart(): JsonObject = client.get("/api/shopping/cart")

    suspend fun addToCart(payload: Map<String, Any?>): JsonObject = client.post("/api/shopping/cart", payload)

    suspend fun updateCartItem(itemId: Int, payload: Map<String, Any?>): JsonObject =
        client.put("/api/shopping/cart/$itemId", payload)

    suspend fun removeCartItem(itemId: Int): JsonObject = client.delete("/api/shopping/cart/$itemId")

    suspend fun clearCart(): JsonObject = client.delete("/api/shopping/cart/clear")

    suspend fun checkout(payload: Map<String, Any?>): JsonObject = client.post("/api/shopping/checkout", payload)

    /** Ödeme ve teslimat seçenekleri. */
    suspend fun checkoutOptions(): JsonObject = client.get("/api/shopping/checkout/options")

    /** Kupon uygular ve yeni toplamı döner. */
    suspend fun applyCoupon(code: String): JsonObject =
        client.post("/api/shopping/checkout/coupon", mapOf("code" to code))

    suspend fun carriers(): JsonObject = client.get("/api/shopping/carriers")
}

/** Sipariş yönetimi (satıcı tarafı). `orders` modülü açık olmalı. */
class Orders(private val client: SubmitClient) {
    suspend fun list(params: Map<String, Any?> = emptyMap()): JsonObject =
        client.get("/api/commerce/orders", params)

    suspend fun get(id: Int): JsonObject = client.get("/api/commerce/orders/$id")

    suspend fun update(id: Int, payload: Map<String, Any?>): JsonObject =
        client.put("/api/commerce/orders/$id", payload)

    /** Durum geçişi. Geçersiz geçişler 422 döner. */
    suspend fun updateStatus(id: Int, status: String): JsonObject =
        client.put("/api/commerce/orders/$id/status", mapOf("status" to status))

    suspend fun cancel(id: Int, payload: Map<String, Any?> = emptyMap()): JsonObject =
        client.post("/api/commerce/orders/$id/cancel", payload)

    /** Satış raporu — ciro, adet, dönem kırılımı. */
    suspend fun report(params: Map<String, Any?> = emptyMap()): JsonObject =
        client.get("/api/commerce/orders/report", params)

    suspend fun createInvoice(orderId: Int, payload: Map<String, Any?> = emptyMap()): JsonObject =
        client.post("/api/commerce/orders/$orderId/invoice", payload)

    suspend fun invoice(orderId: Int): JsonObject = client.get("/api/commerce/orders/$orderId/invoice")

    suspend fun mailSettings(): JsonObject = client.get("/api/commerce/orders/mail-settings")

    suspend fun updateMailSettings(payload: Map<String, Any?>): JsonObject =
        client.put("/api/commerce/orders/mail-settings", payload)
}

/** Müşterinin kendi siparişleri. */
class CustomerOrders(private val client: SubmitClient) {
    suspend fun list(params: Map<String, Any?> = emptyMap()): JsonObject = client.get("/api/my-orders", params)

    suspend fun get(id: Int): JsonObject = client.get("/api/my-orders/$id")

    suspend fun cancel(id: Int, payload: Map<String, Any?> = emptyMap()): JsonObject =
        client.post("/api/my-orders/$id/cancel", payload)

    /** Satıcıya sipariş üzerinden mesaj yazar. */
    suspend fun message(id: Int, message: String): JsonObject =
        client.post("/api/my-orders/$id/message", mapOf("message" to message))
}

/** Kullanıcı adresleri. */
class Addresses(private val client: SubmitClient) {
    suspend fun list(): JsonObject = client.get("/api/user/addresses")

    suspend fun create(payload: Map<String, Any?>): JsonObject = client.post("/api/user/addresses", payload)

    suspend fun update(id: Int, payload: Map<String, Any?>): JsonObject =
        client.put("/api/user/addresses/$id", payload)

    suspend fun delete(id: Int): JsonObject = client.delete("/api/user/addresses/$id")
}

/** Ödemeler. Stripe/Tami webhook uçları sunucu-sunucudur, SDK'da yer almaz. */
class Payments(private val client: SubmitClient) {
    suspend fun list(params: Map<String, Any?> = emptyMap()): JsonObject = client.get("/api/payments", params)

    suspend fun get(id: Int): JsonObject = client.get("/api/payments/$id")

    suspend fun create(payload: Map<String, Any?>): JsonObject = client.post("/api/payments", payload)

    /** Stripe PaymentIntent açar — `client_secret` ile Stripe SDK'sına devredin. */
    suspend fun createStripeIntent(payload: Map<String, Any?>): JsonObject =
        client.post("/api/payments/stripe/create-intent", payload)
}

/** Abonelik ve fatura profilleri (SaaS tarafı). */
class Billing(private val client: SubmitClient) {
    suspend fun subscriptions(): JsonObject = client.get("/api/user/subscriptions")

    /** Satın almadan önce vergi dahil tutarı hesaplatır. */
    suspend fun calculatePricing(payload: Map<String, Any?>): JsonObject =
        client.post("/api/user/calculate-pricing", payload)

    suspend fun subscribe(payload: Map<String, Any?>): JsonObject = client.post("/api/user/subscribe", payload)

    suspend fun profiles(): JsonObject = client.get("/api/user/billing-profiles")

    suspend fun createProfile(payload: Map<String, Any?>): JsonObject =
        client.post("/api/user/billing-profiles", payload)

    suspend fun updateProfile(id: Int, payload: Map<String, Any?>): JsonObject =
        client.put("/api/user/billing-profiles/$id", payload)
}
