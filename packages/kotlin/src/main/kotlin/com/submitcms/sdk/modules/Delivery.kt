package com.submitcms.sdk.modules

import com.submitcms.sdk.SubmitClient
import kotlinx.serialization.json.JsonObject

/**
 * Genel teslimat — ziyaretçiye gösterilen her şey.
 *
 * Yalnızca site token'ı ister, oturum gerekmez. Sunucuda önbelleklenir ve
 * yalnızca yayımlanmış içeriği döner.
 *
 * ```kotlin
 * val sdk = SubmitCms(SubmitConfig(token = BuildConfig.SUBMIT_TOKEN))
 * val posts = sdk.delivery.records("blog", mapOf("per_page" to 10))
 * ```
 */
class Delivery(private val client: SubmitClient) {

    suspend fun records(typeCode: String, params: Map<String, Any?> = emptyMap()): JsonObject =
        client.get("/api/public/records/${esc(typeCode)}", params)

    suspend fun record(typeCode: String, slug: String, params: Map<String, Any?> = emptyMap()): JsonObject =
        client.get("/api/public/records/${esc(typeCode)}/item/${esc(slug)}", params)

    /** "Bunlar da ilginizi çekebilir" — ilgili kayıtlar. */
    suspend fun alsoRead(typeCode: String, slug: String): JsonObject =
        client.get("/api/public/records/${esc(typeCode)}/item/${esc(slug)}/also-read")

    /** Görüntülenme kaydeder. [duration] saniye cinsinden okuma süresi. */
    suspend fun ping(typeCode: String, slug: String, duration: Int = 0): JsonObject =
        client.post("/api/public/records/${esc(typeCode)}/item/${esc(slug)}/ping", mapOf("duration" to duration))

    suspend fun schema(typeCode: String): JsonObject =
        client.get("/api/public/records/${esc(typeCode)}/schema")

    suspend fun categories(): JsonObject = client.get("/api/public/categories")

    suspend fun category(slug: String): JsonObject = client.get("/api/public/categories/${esc(slug)}")

    /** Menüyü çözülmüş ağaç olarak döner. */
    suspend fun menu(code: String): JsonObject = client.get("/api/public/menus/${esc(code)}")

    /** Açılışta gereken her şey tek istekte: site bilgisi, tasarım, diller, menüler. */
    suspend fun init(): JsonObject = client.get("/api/public/init")

    suspend fun environment(token: String): JsonObject = client.get("/api/public/environment/${esc(token)}")

    suspend fun navigation(slug: String): JsonObject = client.get("/api/public/navigation/${esc(slug)}")

    suspend fun banners(): JsonObject = client.get("/api/public/banners")

    suspend fun gallery(slug: String): JsonObject = client.get("/api/public/gallery/${esc(slug)}")

    suspend fun products(params: Map<String, Any?> = emptyMap()): JsonObject =
        client.get("/api/public/products", params)

    suspend fun product(slug: String): JsonObject = client.get("/api/public/product/${esc(slug)}")

    suspend fun productCategory(slug: String): JsonObject =
        client.get("/api/public/product-categories/${esc(slug)}")

    suspend fun productCollection(id: String): JsonObject =
        client.get("/api/public/product-collection/${esc(id)}")

    /**
     * Canvas — v2 şemasından önceki içerik modeli. Yeni projelerde [records]
     * kullanın; bunlar eski siteler için ayakta.
     */
    suspend fun canvasList(params: Map<String, Any?> = emptyMap()): JsonObject =
        client.get("/api/public/canvas", params)

    suspend fun canvas(slug: String): JsonObject = client.get("/api/public/canvas/${esc(slug)}")

    suspend fun canvasCollection(id: String): JsonObject = client.get("/api/public/collection/${esc(id)}")

    suspend fun documents(params: Map<String, Any?> = emptyMap()): JsonObject =
        client.get("/api/documents", params)

    suspend fun document(slug: String): JsonObject = client.get("/api/documents/${esc(slug)}")

    suspend fun documentCollection(id: String): JsonObject =
        client.get("/api/documents/collection/${esc(id)}")

    suspend fun documentProducts(params: Map<String, Any?> = emptyMap()): JsonObject =
        client.get("/api/documents/products", params)

    /**
     * Mevcut bir ticket'a mesaj ekler.
     *
     * Adı yanıltıcıdır ve sürüm uyumu için korunuyor: form şeması dönmez
     * (`setTicketContent`); `ticket` ve `message` zorunludur. Yeni talep için
     * [submitTicket] kullanın.
     */
    suspend fun ticketForm(payload: Map<String, Any?> = emptyMap()): JsonObject =
        client.post("/api/public/ticket-content", payload)

    /**
     * Yeni iletişim/destek talebi açar.
     *
     * Zorunlu alanlar: type, subject, user, name, email, gdpr, advertising, drp.
     */
    suspend fun submitTicket(payload: Map<String, Any?>): JsonObject =
        client.post("/api/public/ticket-submit", payload)

    suspend fun notifications(token: String): JsonObject =
        client.get("/api/public/notification/${esc(token)}")

    /** Sitemap adresi. XML olduğu için ayrıştırılmaz. */
    fun sitemapUrl(envToken: String): String =
        "${client.baseUrl}/api/public/sitemap.xml?env=${esc(envToken)}"

    /** Siteye özel, her zaman güncel entegrasyon rehberi. */
    suspend fun manifest(): JsonObject = client.get("/api/public/manifest")

    /** `llms.txt` — yapay zekâ araçları için düz metin (JSON zarfı yok). */
    suspend fun llmsTxt(): String = client.raw("/api/public/llms.txt")
}
