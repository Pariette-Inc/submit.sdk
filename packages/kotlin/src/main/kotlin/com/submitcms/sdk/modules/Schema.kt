package com.submitcms.sdk.modules

import com.submitcms.sdk.SubmitClient
import kotlinx.serialization.json.JsonObject

/**
 * İçerik tipleri — sitenin veri şeması.
 *
 * Önce tip tanımlarsınız, sonra [Records] ile o tipte kayıt açarsınız.
 */
class ContentTypes(private val client: SubmitClient) {
    suspend fun list(): JsonObject = client.get("/api/schema/types")

    suspend fun get(code: String): JsonObject = client.get("/api/schema/types/${esc(code)}")

    suspend fun create(payload: Map<String, Any?>): JsonObject = client.post("/api/schema/types", payload)

    /**
     * Tipi günceller ve sürümü artırır. Alan silmek eski kayıtlardaki
     * değerleri düşürür.
     */
    suspend fun update(code: String, payload: Map<String, Any?>): JsonObject =
        client.put("/api/schema/types/${esc(code)}", payload)

    suspend fun delete(code: String): JsonObject = client.delete("/api/schema/types/${esc(code)}")

    /** Panelin kayıt formunu çizdiği tanım — kendi arayüzünüz için. */
    suspend fun form(code: String): JsonObject = client.get("/api/schema/types/${esc(code)}/form")

    suspend fun revisions(code: String): JsonObject = client.get("/api/schema/types/${esc(code)}/revisions")

    /** Bu tipe özel, siteye göre kişiselleştirilmiş entegrasyon örnekleri. */
    suspend fun integration(code: String): JsonObject =
        client.get("/api/schema/types/${esc(code)}/integration")

    /** Şemayı yapay zekâ ile üretir. */
    suspend fun aiGenerate(code: String, payload: Map<String, Any?>): JsonObject =
        client.post("/api/schema/types/${esc(code)}/ai/generate", payload)
}

/** Kayıt kategorileri — ağacı `parent_id` kurar. */
class Categories(private val client: SubmitClient) {
    suspend fun list(): JsonObject = client.get("/api/schema/categories")

    suspend fun create(payload: Map<String, Any?>): JsonObject = client.post("/api/schema/categories", payload)

    suspend fun update(id: Int, payload: Map<String, Any?>): JsonObject =
        client.put("/api/schema/categories/$id", payload)

    suspend fun delete(id: Int): JsonObject = client.delete("/api/schema/categories/$id")
}

/**
 * Sitenin dilleri.
 *
 * Burada tanımlı olmayan bir dile kayıt yazılamaz (422) — bu, panelde hiç
 * görünmeyen "hayalet" çevirileri engeller.
 */
class Locales(private val client: SubmitClient) {
    suspend fun list(): JsonObject = client.get("/api/schema/locales")

    suspend fun add(code: String): JsonObject = client.post("/api/schema/locales", mapOf("code" to code))

    suspend fun remove(code: String): JsonObject = client.delete("/api/schema/locales/${esc(code)}")
}

/** Şema sistemine dair yardımcı uçlar. */
class Schema(private val client: SubmitClient) {
    /** Desteklenen alan tipleri ve ayar şemaları. */
    suspend fun fieldTypes(): JsonObject = client.get("/api/schema/field-types")

    /** Hazır şema şablonları. */
    suspend fun presets(): JsonObject = client.get("/api/schema/presets")

    /** Sitede hangi modüller açık. */
    suspend fun modules(): JsonObject = client.get("/api/schema/modules")

    /** Site haritası özeti. */
    suspend fun sitemap(): JsonObject = client.get("/api/schema/sitemap")
}

/**
 * Menüler — site gezinmesi.
 *
 * Ziyaretçiye çözülmüş hâlini `sdk.delivery.menu(code)` ile verin.
 */
class Menus(private val client: SubmitClient) {
    suspend fun list(): JsonObject = client.get("/api/menus")

    suspend fun get(code: String): JsonObject = client.get("/api/menus/${esc(code)}")

    suspend fun create(payload: Map<String, Any?>): JsonObject = client.post("/api/menus", payload)

    suspend fun update(code: String, payload: Map<String, Any?>): JsonObject =
        client.put("/api/menus/${esc(code)}", payload)

    suspend fun delete(code: String): JsonObject = client.delete("/api/menus/${esc(code)}")

    /** Ağacı kaydetmeden çözer — kırık bağlantıları yayına almadan görmek için. */
    suspend fun preview(code: String): JsonObject = client.get("/api/menus/${esc(code)}/preview")

    suspend fun revisions(code: String): JsonObject = client.get("/api/menus/${esc(code)}/revisions")

    suspend fun restore(code: String, version: Int): JsonObject =
        client.post("/api/menus/${esc(code)}/restore/$version")
}
