package com.submitcms.sdk

import com.submitcms.sdk.modules.Addresses
import com.submitcms.sdk.modules.Ai
import com.submitcms.sdk.modules.Auth
import com.submitcms.sdk.modules.Billing
import com.submitcms.sdk.modules.Cart
import com.submitcms.sdk.modules.Categories
import com.submitcms.sdk.modules.ContentTypes
import com.submitcms.sdk.modules.CustomerOrders
import com.submitcms.sdk.modules.Delivery
import com.submitcms.sdk.modules.Locales
import com.submitcms.sdk.modules.Menus
import com.submitcms.sdk.modules.Orders
import com.submitcms.sdk.modules.Partner
import com.submitcms.sdk.modules.Payments
import com.submitcms.sdk.modules.Platform
import com.submitcms.sdk.modules.Records
import com.submitcms.sdk.modules.Schema
import com.submitcms.sdk.modules.Shopping
import com.submitcms.sdk.modules.Storage
import com.submitcms.sdk.modules.System
import com.submitcms.sdk.modules.Tracking

/**
 * SubmitCMS SDK giriş noktası.
 *
 * ```kotlin
 * val sdk = SubmitCms(SubmitConfig(
 *     token = BuildConfig.SUBMIT_TOKEN,
 *     mode = SubmitMode.PRODUCTION,
 *     locale = "tr",
 * ))
 *
 * // Ziyaretçiye içerik — oturum gerekmez
 * val posts = sdk.delivery.records("blog", mapOf("per_page" to 10))
 *
 * // Panel işlemleri — önce giriş
 * sdk.auth.console("admin@site.com", "parola")
 * sdk.records.create("blog", mapOf(
 *     "data" to mapOf("baslik" to "Merhaba"),
 *     "status" to "published",
 * ))
 * ```
 *
 * Tüm çağrılar `suspend`'dir ve IO dispatcher'a geçer — ana iş parçacığından
 * güvenle çağrılabilir.
 *
 * | Ne yapıyorsunuz | Modül | Kimlik |
 * |---|---|---|
 * | Uygulamada içerik gösterme | `delivery` | site token'ı |
 * | İçerik yazma | `records`, `contentTypes`, `menus` | token + oturum |
 * | Mağaza sepeti | `cart` | site token'ı |
 * | Sipariş yönetimi | `orders` | token + oturum + `orders` modülü |
 * | Müşteri kendi sitesini yönetiyor | `platform` | token + oturum + üyelik |
 * | Bayi paneli | `partner` | partner oturumu |
 */
class SubmitCms(val client: SubmitClient) {

    constructor(config: SubmitConfig) : this(SubmitClient(config))

    val auth = Auth(client)
    val delivery = Delivery(client)

    val records = Records(client)
    val contentTypes = ContentTypes(client)
    val categories = Categories(client)
    val locales = Locales(client)
    val schema = Schema(client)
    val menus = Menus(client)

    val cart = Cart(client)
    val shopping = Shopping(client)
    val orders = Orders(client)
    val myOrders = CustomerOrders(client)
    val addresses = Addresses(client)
    val payments = Payments(client)
    val billing = Billing(client)

    val platform = Platform(client)
    val partner = Partner(client)

    val ai = Ai(client)
    val storage = Storage(client)
    val tracking = Tracking(client)
    val system = System(client)

    /** Oturum token'ını elle yazar — saklanan JWT'yi geri yüklerken. */
    fun setAuthToken(token: String?) = client.setAuthToken(token)

    /** Aktif siteyi değiştirir (`EnvToken`). Çok siteli uygulamalarda. */
    fun setEnvironment(token: String?) = client.setEnvironment(token)

    fun setLocale(locale: String) = client.setLocale(locale)

    /** Misafir sepeti kimliği. */
    fun setGuestId(guestId: String?) = client.setGuestId(guestId)
}
