package com.submitcms.sdk.modules

import com.submitcms.sdk.SubmitClient
import kotlinx.serialization.json.JsonObject

/**
 * İçerik kayıtları — v2 şema sisteminin ana modülü (yazma tarafı).
 *
 * Ziyaretçiye içerik göstermek için [Delivery] kullanın.
 *
 * ```kotlin
 * sdk.records.create("blog", mapOf(
 *     "data" to mapOf("baslik" to "Merhaba"),  // tipin özel alanları
 *     "status" to "published",                  // draft | published | archived
 *     "locale" to "tr",                         // sitenin dil listesinde olmalı
 *     "categories" to listOf(3, 7),
 *     "seo" to mapOf("meta_title" to "..."),
 *     "commerce" to mapOf("price" to 199.90),   // yalnızca ürün tiplerinde
 * ))
 * ```
 */
class Records(private val client: SubmitClient) {

    /**
     * Kayıtları listeler. Filtre işleçleri: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `like`, `in`.
     *
     * ```kotlin
     * sdk.records.list("urun", mapOf(
     *     "status" to "published",
     *     "filter" to mapOf("price" to mapOf("gte" to 100)),
     * ))
     * ```
     */
    suspend fun list(typeCode: String, params: Map<String, Any?> = emptyMap()): JsonObject =
        client.get("/api/schema/records/${esc(typeCode)}", params)

    suspend fun get(typeCode: String, id: Int): JsonObject =
        client.get("/api/schema/records/${esc(typeCode)}/$id")

    /** Yeni kayıt. Plan limiti burada uygulanır — kota dolduysa 403. */
    suspend fun create(typeCode: String, payload: Map<String, Any?>): JsonObject =
        client.post("/api/schema/records/${esc(typeCode)}", payload)

    /** Kısmi güncelleme — yalnızca gönderdiğiniz alanlar değişir. */
    suspend fun update(typeCode: String, id: Int, payload: Map<String, Any?>): JsonObject =
        client.put("/api/schema/records/${esc(typeCode)}/$id", payload)

    suspend fun delete(typeCode: String, id: Int): JsonObject =
        client.delete("/api/schema/records/${esc(typeCode)}/$id")

    suspend fun analytics(typeCode: String, id: Int): JsonObject =
        client.get("/api/schema/records/${esc(typeCode)}/$id/analytics")

    suspend fun revisions(typeCode: String, id: Int): JsonObject =
        client.get("/api/schema/records/${esc(typeCode)}/$id/revisions")

    suspend fun revision(typeCode: String, id: Int, version: Int): JsonObject =
        client.get("/api/schema/records/${esc(typeCode)}/$id/revisions/$version")

    /** Kaydı o sürüme döndürür; mevcut hâl önce anlık görüntüye alınır. */
    suspend fun restoreRevision(typeCode: String, id: Int, version: Int): JsonObject =
        client.post("/api/schema/records/${esc(typeCode)}/$id/revisions/$version/restore")

    suspend fun gallery(typeCode: String, id: Int, field: String): JsonObject =
        client.get("/api/schema/records/${esc(typeCode)}/$id/gallery/${esc(field)}")

    suspend fun addGalleryImage(typeCode: String, id: Int, field: String, payload: Map<String, Any?>): JsonObject =
        client.post("/api/schema/records/${esc(typeCode)}/$id/gallery/${esc(field)}", payload)

    /** Görsel sırasını topluca günceller — verilen id dizisi yeni sıradır. */
    suspend fun reorderGallery(typeCode: String, id: Int, field: String, order: List<Int>): JsonObject =
        client.put("/api/schema/records/${esc(typeCode)}/$id/gallery/${esc(field)}/order", mapOf("order" to order))

    suspend fun updateGalleryImage(
        typeCode: String,
        id: Int,
        field: String,
        imageId: Int,
        payload: Map<String, Any?>,
    ): JsonObject =
        client.put("/api/schema/records/${esc(typeCode)}/$id/gallery/${esc(field)}/$imageId", payload)

    suspend fun removeGalleryImage(typeCode: String, id: Int, field: String, imageId: Int): JsonObject =
        client.delete("/api/schema/records/${esc(typeCode)}/$id/gallery/${esc(field)}/$imageId")

    /** Metni iyileştirir. AI kredisi harcar — bakiye yetmezse 402. */
    suspend fun aiImprove(typeCode: String, id: Int, payload: Map<String, Any?> = emptyMap()): JsonObject =
        client.post("/api/schema/records/${esc(typeCode)}/$id/ai/improve", payload)

    suspend fun aiSeo(typeCode: String, id: Int, payload: Map<String, Any?> = emptyMap()): JsonObject =
        client.post("/api/schema/records/${esc(typeCode)}/$id/ai/seo", payload)

    /** Kaydı hedef dile çevirip kardeş kayıt olarak bağlar. */
    suspend fun aiTranslate(typeCode: String, id: Int, locale: String): JsonObject =
        client.post("/api/schema/records/${esc(typeCode)}/$id/ai/translate", mapOf("locale" to locale))
}
