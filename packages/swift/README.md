# SubmitCMS (Swift)

SubmitCMS'in resmî Swift istemcisi. iOS 15+, macOS 12+, async/await.

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/Pariette-Inc/submit.sdk-swift", from: "1.0.0")
]
```

```swift
import SubmitCMS

let sdk = SubmitCMS(config: .init(
    mode: .production,          // ya da .test
    token: "SITE_TOKEN",
    locale: "tr"
))

// Ziyaretçiye içerik — oturum gerekmez
let posts = try await sdk.delivery.records("blog", params: ["per_page": 10])
let title = posts.data?[0]["data"]?["baslik"]?.stringValue

// Panel işlemleri — önce giriş
try await sdk.auth.console(email: email, password: password)
try await sdk.records.create("blog", payload: [
    "data": ["baslik": "Merhaba"],
    "status": "published",
])
```

## Dinamik içerik ve `JSONValue`

İçerik tiplerini kullanıcı tanımlar — bir `blog` kaydının alanları her sitede
farklıdır, dolayısıyla gövde derleme zamanında bilinemez. Yanıtlar varsayılan
olarak `JSONValue` döner ve alt-indisle okunur:

```swift
let price = record.data?["commerce"]?["price"]?.doubleValue
```

Kendi `Decodable` tipinizi biliyorsanız istemciye verin:

```swift
struct Post: Decodable { let slug: String }
let typed: SubmitResponse<[Post]> = try await sdk.client.get("/api/public/records/blog", as: [Post].self)
```

## Hatalar

```swift
do {
    try await sdk.records.create("blog", payload: payload)
} catch SubmitError.validation(let message, let errors) {
    print(message, errors)
} catch SubmitError.api(let status, let code, _) where code == "MODULE_DISABLED" {
    // ücretli modül kapalı
}
```

`SubmitClient` bir `actor`'dır; başlık ve oturum durumu eşzamanlılık altında güvenlidir.

## Medya adresleri

Yalnız `token` zorunludur. API kökü (`https://live.submitcms.com`) ve medya CDN'i
(`https://cdn.submitcms.com`, `submitCDNURL`) SDK'dan gelir. Kayıtlardaki görsel alanları
CDN'e göre yoldur; tam adres için `media(_:)` kullanın:

```swift
let url = sdk.media(record.data?["image_web"]?.stringValue)  // "site/a.webp" → "https://cdn.submitcms.com/site/a.webp"
sdk.media("")                                                // ""  (boş yol boş kalır)

SubmitConfig(token: token, cdnURL: URL(string: "http://localhost:9000"))  // yerel kopya veya kendi CDN'iniz
```

## Toplu okuma

Birden çok public okumayı tek istekte gönderin (en çok 25 parça). Her parça `{ id, status, body }` olarak döner ve ayrı gösterim sayılır.

```swift
let result = try await sdk.delivery.batch([
    ["id": "footer", "path": "records/page/item/footer"],
    ["id": "news", "path": "records/blog", "query": ["per_page": 3]],
])
```

## Neler dahil değil

SDK yalnızca **canlı** uçları çağırır. submit.api'deki 507 endpoint'in 201'i
2026-07-30 panel emekliliği kararıyla kapatıldı ve 410 `PANEL_RETIRED` dönüyor;
bunların hiçbiri bu pakette yok. Kontrat testleri her derlemede bunu doğrular.

## Dokümantasyon

**https://submitcms.com/sdk** — her modülün her metodu, parametre tabloları,
kimlik gereksinimleri ve dört dilde çalışan örnekler.

## Lisans

MIT

## Diller

`locale` her yazımda kabul edilir (`tr`, `tr-TR`, `tr_TR`, `us`); API sitenin kayıtlı koduna çevirir. `locales.catalog()` dünya dillerini doğru kod (`tr_TR`), kısa kod, yerel ad ve bayrakla verir; `locales.add(code:)` her yazımı kabul eder.
