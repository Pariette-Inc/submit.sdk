# com.submitcms:sdk (Kotlin)

SubmitCMS'in resmî Kotlin/Android istemcisi. Coroutines, OkHttp, kotlinx.serialization.

```kotlin
// build.gradle.kts
implementation("com.submitcms:sdk:1.0.0")
```

```kotlin
import com.submitcms.sdk.SubmitCms
import com.submitcms.sdk.SubmitConfig
import com.submitcms.sdk.SubmitMode

val sdk = SubmitCms(SubmitConfig(
    token = BuildConfig.SUBMIT_TOKEN,
    mode = SubmitMode.PRODUCTION,   // ya da TEST
    locale = "tr",
))

// Ziyaretçiye içerik — oturum gerekmez
val posts = sdk.delivery.records("blog", mapOf("per_page" to 10))

// Panel işlemleri — önce giriş
sdk.auth.console(email, password)
sdk.records.create("blog", mapOf(
    "data" to mapOf("baslik" to "Merhaba"),
    "status" to "published",
))
```

Tüm çağrılar `suspend`'dir ve içeride `Dispatchers.IO`'ya geçer — ana iş
parçacığından güvenle çağrılabilir, ayrıca `withContext` sarmanız gerekmez.

## Yanıtlar

İçerik tiplerini kullanıcı tanımladığı için yanıtlar `JsonObject` döner:

```kotlin
val title = posts["data"]?.jsonArray?.get(0)
    ?.jsonObject?.get("data")?.jsonObject?.get("baslik")?.jsonPrimitive?.content
```

## Hatalar

```kotlin
try {
    sdk.records.create("blog", payload)
} catch (e: SubmitValidationException) {
    e.payload?.get("errors")
} catch (e: SubmitApiException) {
    if (e.code == "MODULE_DISABLED") { /* ücretli modül kapalı */ }
}
```

## ProGuard

kotlinx.serialization kuralları kütüphaneyle birlikte gelir; ek yapılandırma gerekmez.

## Neler dahil değil

SDK yalnızca **canlı** uçları çağırır. submit.api'deki 507 endpoint'in 201'i
2026-07-30 panel emekliliği kararıyla kapatıldı ve 410 `PANEL_RETIRED` dönüyor;
bunların hiçbiri bu pakette yok. Kontrat testleri her derlemede bunu doğrular.

## Dokümantasyon

**https://submitcms.com/sdk** — her modülün her metodu, parametre tabloları,
kimlik gereksinimleri ve dört dilde çalışan örnekler.

## Lisans

MIT
