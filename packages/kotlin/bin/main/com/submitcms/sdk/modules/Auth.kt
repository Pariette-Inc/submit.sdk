package com.submitcms.sdk.modules

import com.submitcms.sdk.SubmitClient
import java.net.URLEncoder
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/** URL segmentine güvenle gömülecek biçimde kaçışlar. */
internal fun esc(value: String): String = URLEncoder.encode(value, "UTF-8").replace("+", "%20")

/**
 * Kimlik doğrulama, hesap, 2FA ve davet işlemleri.
 *
 * Başarılı `login`/`console` sonrası JWT istemciye otomatik yazılır.
 *
 * ```kotlin
 * val result = sdk.auth.login("a@b.com", "parola")
 * val needs2fa = result["data"]?.jsonObject?.get("two_factor_required")
 * ```
 */
class Auth(private val client: SubmitClient) {

    suspend fun login(email: String, password: String): JsonObject =
        capture(client.post("/api/auth/login", mapOf("email" to email, "password" to password)))

    /** Mobil uygulama girişi — web akışından ayrı tutulur. */
    suspend fun loginApp(email: String, password: String): JsonObject =
        capture(client.post("/api/auth/login-app", mapOf("email" to email, "password" to password)))

    /** Panel (Console) girişi. */
    suspend fun console(email: String, password: String): JsonObject =
        capture(client.post("/api/auth/console", mapOf("email" to email, "password" to password)))

    /**
     * Yeni hesap. Hesabın doğrudan aktif olup olmayacağına site karar verir
     * (`environments.auto_activate`); istemci bunu değiştiremez.
     */
    suspend fun register(payload: Map<String, Any?>): JsonObject = client.post("/api/auth/register", payload)

    suspend fun registerAndCreateEnvironment(payload: Map<String, Any?>): JsonObject =
        client.post("/api/auth/registerAndCreateEnvironment", payload)

    suspend fun logout(): JsonObject =
        client.post("/api/auth/logout").also { client.setAuthToken(null) }

    suspend fun me(): JsonObject = client.get("/api/auth/me")

    suspend fun refresh(): JsonObject = capture(client.get("/api/auth/refresh"))

    /** Kullanıcının erişebildiği siteler — site seçici bunu kullanır. */
    suspend fun myEnvironments(): JsonObject = client.get("/api/my-environments")

    suspend fun forgotPassword(email: String): JsonObject =
        client.post("/api/auth/forgot-password", mapOf("email" to email))

    suspend fun resendForgotPasswordMail(email: String): JsonObject =
        client.post("/api/auth/resend-forgot-password-mail", mapOf("email" to email))

    suspend fun checkResetToken(token: String): JsonObject =
        client.get("/api/auth/check-reset-token", mapOf("token" to token))

    suspend fun resetPassword(payload: Map<String, Any?>): JsonObject =
        client.post("/api/auth/reset-password", payload)

    suspend fun updatePassword(payload: Map<String, Any?>): JsonObject =
        client.post("/api/auth/password/update", payload)

    suspend fun updateProfile(payload: Map<String, Any?>): JsonObject =
        client.post("/api/auth/profile/update", payload)

    suspend fun updateEmail(payload: Map<String, Any?>): JsonObject =
        client.post("/api/auth/email/update", payload)

    suspend fun updateAuthMethod(payload: Map<String, Any?>): JsonObject =
        client.post("/api/auth/auth-method/update", payload)

    suspend fun activateAccount(token: String): JsonObject =
        client.put("/api/auth/account-activation/${esc(token)}")

    suspend fun invitation(token: String): JsonObject = client.get("/api/auth/invitation/${esc(token)}")

    suspend fun completeInvitation(payload: Map<String, Any?>): JsonObject =
        client.post("/api/auth/complete-invitation", payload)

    /**
     * Google akışı tarayıcı yönlendirmesiyle yürür — bu adresi Custom Tabs ile
     * açın, XHR ile çağrılamaz.
     */
    fun googleRedirectUrl(): String = "${client.baseUrl}/api/auth/google/redirect"

    suspend fun setupTwoFactor(): JsonObject = client.post("/api/auth/2fa/setup")

    suspend fun confirmTwoFactor(code: String): JsonObject =
        client.post("/api/auth/2fa/confirm", mapOf("code" to code))

    /** Girişteki 2FA adımını tamamlar; başarılıysa JWT yazılır. */
    suspend fun verifyTwoFactor(token: String, code: String): JsonObject =
        capture(client.post("/api/auth/2fa/verify", mapOf("token" to token, "code" to code)))

    suspend fun disableTwoFactor(password: String): JsonObject =
        client.post("/api/auth/2fa/disable", mapOf("password" to password))

    suspend fun registerDevice(payload: Map<String, Any?>): JsonObject =
        client.post("/api/auth/device/register", payload)

    suspend fun removeDevice(token: String): JsonObject =
        client.post("/api/auth/device/remove", mapOf("token" to token))

    /** Yanıtta token varsa istemciye yazar. */
    private fun capture(response: JsonObject): JsonObject {
        (response["data"] as? JsonObject)?.get("token")?.jsonPrimitive?.contentOrNull?.let {
            client.setAuthToken(it)
        }
        return response
    }
}
