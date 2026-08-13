package com.submitcms.sdk

import java.io.IOException
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.toRequestBody

/** API ortamı. */
enum class SubmitMode(val baseUrl: String) {
    PRODUCTION("https://live.submitcms.com"),
    TEST("https://dev.submitcms.com"),
}

data class SubmitConfig(
    /** Site token'ı — `SubmitToken` başlığıyla gönderilir. */
    val token: String,
    /** `baseUrl` verilirse yok sayılır. */
    val mode: SubmitMode = SubmitMode.PRODUCTION,
    val locale: String? = null,
    val timeoutSeconds: Long = 30,
    /** Yerel geliştirme ya da self-hosted kurulum için API kökü. */
    val baseUrl: String? = null,
    /** Ağ ve 5xx hatalarında kaç kez yeniden denensin. */
    val retries: Int = 3,
)

/**
 * API 4xx/5xx döndüğünde fırlatılır.
 *
 * [code] backend'in makine-okunur kodudur (`PANEL_RETIRED`, `MODULE_DISABLED`,
 * `ENV_REQUIRED` gibi) — mesaj değişebilir, kod değişmez; dallanırken kodu kullanın.
 */
open class SubmitApiException(
    val status: Int,
    val code: String?,
    message: String,
    val payload: JsonObject? = null,
) : RuntimeException(message)

class SubmitUnauthorizedException(status: Int, code: String?, message: String, payload: JsonObject?) :
    SubmitApiException(status, code, message, payload)

class SubmitValidationException(status: Int, code: String?, message: String, payload: JsonObject?) :
    SubmitApiException(status, code, message, payload)

class SubmitRateLimitException(val retryAfterSeconds: Int, message: String) :
    SubmitApiException(429, "RATE_LIMITED", message)

/** Sunucuya hiç ulaşılamadı — DNS, bağlantı ya da zaman aşımı. */
class SubmitNetworkException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)

/**
 * SubmitCMS HTTP istemcisi.
 *
 * Ağ ve 5xx hatalarında üstel bekleyerek yeniden dener. 429'da sunucunun
 * `Retry-After` süresine saygı duyar — üstel geri çekilme uygulamaz, çünkü
 * pencere sunucunun bildiği bir şeydir.
 */
class SubmitClient(private val config: SubmitConfig, http: OkHttpClient? = null) {

    companion object {
        const val ENV_HEADER = "SubmitToken"
        const val ENV_OVERRIDE_HEADER = "EnvToken"
        private const val MAX_RATE_LIMIT_RETRIES = 3
        private val RETRYABLE = setOf(408, 500, 502, 503, 504)

        /** İç içe map'leri Laravel'in beklediği `filter[alan][işleç]=değer` biçimine açar. */
        fun flatten(params: Map<String, Any?>, prefix: String = ""): List<Pair<String, String>> =
            params.flatMap { (key, value) ->
                val name = if (prefix.isEmpty()) key else "$prefix[$key]"
                when (value) {
                    null -> emptyList()
                    is Map<*, *> ->
                        @Suppress("UNCHECKED_CAST")
                        flatten(value as Map<String, Any?>, name)
                    // PHP'nin boolean doğrulaması "true" dizesini kabul etmez.
                    is Boolean -> listOf(name to if (value) "1" else "0")
                    is Iterable<*> -> value.filterNotNull().map { "$name[]" to it.toString() }
                    else -> listOf(name to value.toString())
                }
            }
    }

    val baseUrl: String = (config.baseUrl ?: config.mode.baseUrl).trimEnd('/')

    private val json = Json { ignoreUnknownKeys = true; explicitNulls = false }

    private val http: OkHttpClient =
        http
            ?: OkHttpClient.Builder()
                .callTimeout(config.timeoutSeconds, TimeUnit.SECONDS)
                .build()

    private val headers = mutableMapOf("Accept" to "application/json", ENV_HEADER to config.token)
    private var authToken: String? = null

    init {
        config.locale?.let { headers["Locale"] = it }
    }

    /** Oturum JWT'si — `auth.login` bunu kendisi yazar. */
    fun setAuthToken(token: String?) {
        authToken = token
    }

    fun authToken(): String? = authToken

    /**
     * Aktif siteyi değiştirir (`EnvToken`).
     *
     * Backend site kimliğini `?env=` → `token` → `EnvToken` → `SubmitToken`
     * sırasıyla çözer, yani bu çağrı yapılandırmadaki token'ı ezer.
     */
    fun setEnvironment(token: String?) {
        if (token == null) headers.remove(ENV_OVERRIDE_HEADER) else headers[ENV_OVERRIDE_HEADER] = token
    }

    fun setLocale(locale: String) {
        headers["Locale"] = locale
    }

    /** Misafir sepeti kimliği. */
    fun setGuestId(guestId: String?) {
        if (guestId == null) headers.remove("X-Guest-Id") else headers["X-Guest-Id"] = guestId
    }

    // ── Fiiller ──────────────────────────────────────────────────────────────

    suspend fun get(path: String, query: Map<String, Any?> = emptyMap()): JsonObject =
        send(path, "GET", query, null)

    suspend fun post(path: String, body: Map<String, Any?> = emptyMap()): JsonObject =
        send(path, "POST", emptyMap(), body)

    suspend fun put(path: String, body: Map<String, Any?> = emptyMap()): JsonObject =
        send(path, "PUT", emptyMap(), body)

    suspend fun delete(path: String): JsonObject = send(path, "DELETE", emptyMap(), null)

    /** JSON zarfına sarılmayan uçlar için ham gövde (`llms.txt` gibi). */
    suspend fun raw(path: String, query: Map<String, Any?> = emptyMap()): String =
        perform(buildRequest(path, "GET", query, null))

    /** Çok parçalı dosya yükleme. */
    suspend fun upload(
        path: String,
        files: List<UploadFile>,
        fields: Map<String, String> = emptyMap(),
    ): JsonObject {
        val builder = MultipartBody.Builder().setType(MultipartBody.FORM)
        fields.forEach { (key, value) -> builder.addFormDataPart(key, value) }
        files.forEach {
            builder.addFormDataPart(
                it.field,
                it.filename,
                it.bytes.toRequestBody(it.mimeType.toMediaType()),
            )
        }

        val request = requestBuilder(path, emptyMap()).post(builder.build()).build()
        return json.parseToJsonElement(perform(request)).jsonObject
    }

    data class UploadFile(
        val field: String,
        val filename: String,
        val mimeType: String,
        val bytes: ByteArray,
    )

    // ── İç işleyiş ───────────────────────────────────────────────────────────

    private suspend fun send(
        path: String,
        method: String,
        query: Map<String, Any?>,
        body: Map<String, Any?>?,
    ): JsonObject = json.parseToJsonElement(perform(buildRequest(path, method, query, body))).jsonObject

    private fun requestBuilder(path: String, query: Map<String, Any?>): Request.Builder {
        val url: HttpUrl =
            (baseUrl + "/" + path.trimStart('/'))
                .toHttpUrl()
                .newBuilder()
                .apply { flatten(query).forEach { (key, value) -> addQueryParameter(key, value) } }
                .build()

        val builder = Request.Builder().url(url)
        headers.forEach { (key, value) -> builder.header(key, value) }
        authToken?.let { builder.header("Authorization", "Bearer $it") }
        return builder
    }

    private fun buildRequest(
        path: String,
        method: String,
        query: Map<String, Any?>,
        body: Map<String, Any?>?,
    ): Request {
        val payload: RequestBody? =
            body?.let { toJsonElement(it).toString().toRequestBody("application/json".toMediaType()) }

        return requestBuilder(path, query)
            .method(method, payload ?: if (method in setOf("POST", "PUT", "PATCH")) EMPTY_BODY else null)
            .build()
    }

    private suspend fun perform(request: Request): String =
        withContext(Dispatchers.IO) {
            var attempt = 0
            var rateLimitAttempts = 0

            while (true) {
                // Bekleme `use` bloğunun DIŞINDA yapılır: yanıt gövdesi
                // kapanmadan uyumak bağlantıyı havuzda tutar.
                var waitMillis: Long? = null

                val body =
                    try {
                        http.newCall(request).execute().use { response ->
                            val status = response.code
                            val text = response.body?.string().orEmpty()

                            when {
                                // 429: sunucunun verdiği süre beklenir, tahmin yürütülmez.
                                status == 429 && rateLimitAttempts < MAX_RATE_LIMIT_RETRIES -> {
                                    rateLimitAttempts++
                                    waitMillis = (response.header("Retry-After")?.toIntOrNull() ?: 1) * 1000L
                                    null
                                }
                                status in RETRYABLE && attempt < config.retries -> {
                                    attempt++
                                    waitMillis = backoff(attempt)
                                    null
                                }
                                status >= 400 -> throw errorFor(status, text)
                                else -> text
                            }
                        }
                    } catch (e: IOException) {
                        if (attempt >= config.retries) {
                            throw SubmitNetworkException("Sunucuya ulaşılamadı: ${e.message}", e)
                        }
                        attempt++
                        waitMillis = backoff(attempt)
                        null
                    }

                if (body != null) return@withContext body
                waitMillis?.let { delay(it) }
            }
            @Suppress("UNREACHABLE_CODE") error("ulaşılamaz")
        }

    private fun backoff(attempt: Int): Long = minOf(10_000L, 1000L * (1 shl (attempt - 1)))

    private fun errorFor(status: Int, text: String): SubmitApiException {
        val payload = runCatching { json.parseToJsonElement(text).jsonObject }.getOrNull()
        val bag = payload?.get("error") as? JsonObject
        val message =
            bag?.get("message")?.jsonPrimitive?.contentOrNull
                ?: payload?.get("message")?.jsonPrimitive?.contentOrNull
                ?: "Bilinmeyen hata"
        val code = bag?.get("code")?.jsonPrimitive?.contentOrNull

        return when (status) {
            401, 403 -> SubmitUnauthorizedException(status, code, message, payload)
            422 -> SubmitValidationException(status, code, message, payload)
            429 -> SubmitRateLimitException(1, message)
            else -> SubmitApiException(status, code, message, payload)
        }
    }

    private fun toJsonElement(value: Any?): JsonElement =
        when (value) {
            null -> kotlinx.serialization.json.JsonNull
            is JsonElement -> value
            is Map<*, *> ->
                JsonObject(value.entries.associate { (k, v) -> k.toString() to toJsonElement(v) })
            is Iterable<*> -> kotlinx.serialization.json.JsonArray(value.map { toJsonElement(it) })
            is Number -> JsonPrimitive(value)
            is Boolean -> JsonPrimitive(value)
            else -> JsonPrimitive(value.toString())
        }
}

private val EMPTY_BODY: RequestBody = ByteArray(0).toRequestBody(null, 0, 0)
