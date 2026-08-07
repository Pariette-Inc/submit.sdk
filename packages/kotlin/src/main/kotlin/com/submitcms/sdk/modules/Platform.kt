package com.submitcms.sdk.modules

import com.submitcms.sdk.SubmitClient
import kotlinx.serialization.json.JsonObject

/**
 * Müşterinin kendi sitesini yönettiği self-servis uçlar (`platform/my`).
 * Site üyeliği zorunlu.
 */
class Platform(private val client: SubmitClient) {
    /** Plan, kota kullanımı ve site durumu. */
    suspend fun overview(): JsonObject = client.get("/api/platform/my/overview")

    suspend fun analytics(params: Map<String, Any?> = emptyMap()): JsonObject =
        client.get("/api/platform/my/analytics", params)

    suspend fun payments(params: Map<String, Any?> = emptyMap()): JsonObject =
        client.get("/api/platform/my/payments", params)

    suspend fun receipts(): JsonObject = client.get("/api/platform/my/receipts")

    /** PDF indirme adresi — ikili veri döndürülmez. */
    fun receiptPdfUrl(id: Int): String = "${client.baseUrl}/api/platform/my/receipts/$id/pdf"

    suspend fun modules(): JsonObject = client.get("/api/platform/my/modules")

    /** Modülü satın alır; ödeme gerekiyorsa yanıtta yönlendirme döner. */
    suspend fun purchaseModule(code: String, payload: Map<String, Any?> = emptyMap()): JsonObject =
        client.post("/api/platform/my/modules/${esc(code)}/purchase", payload)

    suspend fun domains(): JsonObject = client.get("/api/platform/my/domains")

    /**
     * Özel alan adı ekler. Dönen TXT kaydını DNS'e ekleyip [verifyDomain]
     * çağırın; kayıt `_submit.<alan adı>` altında aranır.
     */
    suspend fun addDomain(domain: String): JsonObject =
        client.post("/api/platform/my/domains", mapOf("domain" to domain))

    suspend fun verifyDomain(id: Int): JsonObject = client.post("/api/platform/my/domains/$id/verify")

    suspend fun removeDomain(id: Int): JsonObject = client.delete("/api/platform/my/domains/$id")

    suspend fun team(): JsonObject = client.get("/api/platform/my/team")

    suspend fun inviteTeamMember(payload: Map<String, Any?>): JsonObject =
        client.post("/api/platform/my/team/invite", payload)

    suspend fun cancelInvitation(id: Int): JsonObject =
        client.delete("/api/platform/my/team/invitations/$id")

    suspend fun removeTeamMember(id: Int): JsonObject = client.delete("/api/platform/my/team/members/$id")

    /** Herkese açık paket listesi — fiyatlandırma ekranı için. */
    suspend fun plans(): JsonObject = client.get("/api/platform/plans")

    /** Ödeme bağlantısı — oturum gerekmez. */
    suspend fun payLink(token: String): JsonObject = client.get("/api/platform/pay/${esc(token)}")

    suspend fun payByCard(token: String, payload: Map<String, Any?>): JsonObject =
        client.post("/api/platform/pay/${esc(token)}/card", payload)

    suspend fun payByBankTransfer(token: String, payload: Map<String, Any?>): JsonObject =
        client.post("/api/platform/pay/${esc(token)}/bank-transfer", payload)

    /** Whitelabel partner açılış sayfası. */
    suspend fun partnerSite(slug: String): JsonObject = client.get("/api/platform/site/${esc(slug)}")

    suspend fun buyPackage(slug: String, packageId: Int, payload: Map<String, Any?> = emptyMap()): JsonObject =
        client.post("/api/platform/site/${esc(slug)}/packages/$packageId/buy", payload)
}

/** Partner paneli — bayi/ajans tarafı. Partner rolündeki oturum ister. */
class Partner(private val client: SubmitClient) {
    suspend fun dashboard(): JsonObject = client.get("/api/platform/partner/dashboard")

    suspend fun settings(): JsonObject = client.get("/api/platform/partner/settings")

    suspend fun updateSettings(payload: Map<String, Any?>): JsonObject =
        client.put("/api/platform/partner/settings", payload)

    suspend fun modules(): JsonObject = client.get("/api/platform/partner/modules")

    suspend fun customers(params: Map<String, Any?> = emptyMap()): JsonObject =
        client.get("/api/platform/partner/customers", params)

    suspend fun customer(id: Int): JsonObject = client.get("/api/platform/partner/customers/$id")

    /** Müşteriye özel fiyat tanımlar. */
    suspend fun setCustomerPrices(id: Int, payload: Map<String, Any?>): JsonObject =
        client.post("/api/platform/partner/customers/$id/prices", payload)

    suspend fun packages(): JsonObject = client.get("/api/platform/partner/packages")

    suspend fun createPackage(payload: Map<String, Any?>): JsonObject =
        client.post("/api/platform/partner/packages", payload)

    suspend fun updatePackage(id: Int, payload: Map<String, Any?>): JsonObject =
        client.put("/api/platform/partner/packages/$id", payload)

    suspend fun deletePackage(id: Int): JsonObject = client.delete("/api/platform/partner/packages/$id")

    /** Ödeme bağlantıları — müşteriye gönderilen tek kullanımlık tahsilat linki. */
    suspend fun checkoutLinks(): JsonObject = client.get("/api/platform/partner/checkout-links")

    suspend fun createCheckoutLink(payload: Map<String, Any?>): JsonObject =
        client.post("/api/platform/partner/checkout-links", payload)

    suspend fun sendCheckoutLink(id: Int): JsonObject =
        client.post("/api/platform/partner/checkout-links/$id/send")

    suspend fun cancelCheckoutLink(id: Int): JsonObject =
        client.post("/api/platform/partner/checkout-links/$id/cancel")

    suspend fun gateways(): JsonObject = client.get("/api/platform/partner/gateways")

    suspend fun createGateway(payload: Map<String, Any?>): JsonObject =
        client.post("/api/platform/partner/gateways", payload)

    suspend fun updateGateway(id: Int, payload: Map<String, Any?>): JsonObject =
        client.put("/api/platform/partner/gateways/$id", payload)

    suspend fun deleteGateway(id: Int): JsonObject = client.delete("/api/platform/partner/gateways/$id")

    /** Anahtarları test eder. */
    suspend fun verifyGateway(id: Int): JsonObject =
        client.post("/api/platform/partner/gateways/$id/verify")

    suspend fun bankTransfers(): JsonObject = client.get("/api/platform/partner/bank-transfers")

    /** Havale bildirimini onaylar ya da reddeder. */
    suspend fun reviewBankTransfer(id: Int, payload: Map<String, Any?>): JsonObject =
        client.post("/api/platform/partner/bank-transfers/$id/review", payload)

    suspend fun transfers(): JsonObject = client.get("/api/platform/partner/transfers")

    suspend fun createTransfer(payload: Map<String, Any?>): JsonObject =
        client.post("/api/platform/partner/transfers", payload)

    suspend fun respondTransfer(id: Int, payload: Map<String, Any?>): JsonObject =
        client.post("/api/platform/partner/transfers/$id/respond", payload)

    fun receiptPdfUrl(id: Int): String = "${client.baseUrl}/api/platform/partner/receipts/$id/pdf"
}
