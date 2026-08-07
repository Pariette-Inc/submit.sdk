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

## Neler dahil değil

SDK yalnızca **canlı** uçları çağırır. submit.api'deki 507 endpoint'in 201'i
2026-07-30 panel emekliliği kararıyla kapatıldı ve 410 `PANEL_RETIRED` dönüyor;
bunların hiçbiri bu pakette yok. Kontrat testleri her derlemede bunu doğrular.

## Dokümantasyon

**https://submitcms.com/sdk** — her modülün her metodu, parametre tabloları,
kimlik gereksinimleri ve dört dilde çalışan örnekler.

## Lisans

MIT
