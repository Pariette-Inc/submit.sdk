package com.submitcms.sdk.modules

import com.submitcms.sdk.SubmitClient
import kotlinx.serialization.json.JsonObject

/** Yapay zekâ kredileri. Her AI çağrısı kredi harcar; bakiye yetmezse 402. */
class Ai(private val client: SubmitClient) {
    suspend fun credits(): JsonObject = client.get("/api/ai/credits")

    suspend fun packages(): JsonObject = client.get("/api/ai/credits/packages")

    suspend fun purchase(packageId: Int): JsonObject =
        client.post("/api/ai/credits/purchase", mapOf("package_id" to packageId))

    /** Harcama geçmişi — hangi işlem ne kadar kredi yaktı. */
    suspend fun transactions(params: Map<String, Any?> = emptyMap()): JsonObject =
        client.get("/api/ai/credits/transactions", params)

    /** Kullanılabilir görsel modelleri ve kredi maliyetleri. */
    suspend fun imageModels(): JsonObject = client.get("/api/schema/ai/image-models")

    /** Görsel üretir ve site medyasına kaydeder. */
    suspend fun generateImage(payload: Map<String, Any?>): JsonObject =
        client.post("/api/schema/ai/image", payload)
}

/** Dosya yükleme. */
class Storage(private val client: SubmitClient) {
    /** Tek görsel yükler. */
    suspend fun uploadImage(
        bytes: ByteArray,
        filename: String,
        mimeType: String = "image/jpeg",
    ): JsonObject =
        client.upload("/api/storage-image", listOf(SubmitClient.UploadFile("image", filename, mimeType, bytes)))

    /** Birden çok görseli tek istekte yükler. */
    suspend fun uploadImages(files: List<Triple<String, String, ByteArray>>): JsonObject =
        client.upload(
            "/api/storage-images",
            files.map { (filename, mimeType, bytes) ->
                SubmitClient.UploadFile("images[]", filename, mimeType, bytes)
            },
        )
}

/** Ziyaretçi takibi ve hata bildirimi. Site token'ı yeter. */
class Tracking(private val client: SubmitClient) {
    suspend fun track(payload: Map<String, Any?>): JsonObject = client.post("/api/track", payload)

    suspend fun reportError(payload: Map<String, Any?>): JsonObject =
        client.post("/api/public/client-error", payload)
}

/** Servis durumu — uptime kontrolleri için. */
class System(private val client: SubmitClient) {
    suspend fun health(): JsonObject = client.get("/api/health")
}
