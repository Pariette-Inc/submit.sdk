# submit.sdk

SubmitCMS platformunun resmî SDK'ları. Tek repo, çok dil — hepsi aynı API yüzeyini konuşur.

| Paket | Dil | Registry | Kurulum |
|---|---|---|---|
| [`packages/js`](packages/js) | TypeScript | npm | `npm i @submitcms/sdk` |
| [`packages/php`](packages/php) | PHP 8.2+ | Packagist | `composer require submitcms/sdk` |
| [`packages/swift`](packages/swift) | Swift 5.9+ | SwiftPM | `.package(url: "…/submit.sdk-swift")` |
| [`packages/kotlin`](packages/kotlin) | Kotlin | Maven Central | `com.submitcms:sdk` |

Dokümantasyon: **https://submitcms.com/sdk**

## Neden tek repo

API yüzeyi tek: [`submit.api`](https://github.com/Pariette-Inc/submit.api). Bir endpoint değişince tek yerde
güncellenir ve [kontrat testleri](tests/contract) dört istemciyi birden doğrular. Ayrı repolarda bu
kaçınılmaz olarak sapar.

Packagist ve SwiftPM alt klasörden paket okuyamaz (`composer.json` / `Package.swift` repo kökünde olmak
zorunda, sürüm çözümü kök tag'lerinden yapılır). Bu ikisi için CI salt-okunur ayna repo üretir:

```
submit.sdk (kaynak, tag: v1.0.0)
      ├─► packages/js     ──► npm publish ────────────► npmjs.com
      ├─► packages/php    ──► split ──► submit.sdk-php ──► Packagist
      ├─► packages/swift  ──► split ──► submit.sdk-swift ─► SwiftPM
      └─► packages/kotlin ──► gradle publish ──────────► Maven Central
```

Ayna repolara elle dokunulmaz.

## spec/ — tek doğruluk kaynağı

[`spec/endpoints.json`](spec/endpoints.json) submit.api'nin gerçek rota tablosundan üretilir
(`php artisan route:list`). Elle düzenlenmez:

```bash
pnpm spec:generate --api-path ../submit.api
```

Her endpoint için metod, yol, kimlik doğrulama zinciri, modül kapısı, rate limit ve **canlı mı emekli mi**
bilgisi tutar. Emekli uçlar (`status: "retired"`) 410 `PANEL_RETIRED` döner — SDK'lar bunları çağırmaz.

> Bu ayrım kozmetik değil: 2026-07-30 panel emekliliği kararıyla eski sahip-yönetim uçlarının tamamı
> kapatıldı, yerine `schema/records`, `menus`, `platform/my` ve `commerce` geldi. 507 endpoint'in
> 201'i bu durumda.

## Geliştirme

```bash
pnpm install
pnpm spec:generate --api-path ../submit.api   # spec'i tazele
pnpm -r build                                  # tüm paketleri derle
pnpm test:contract                             # SDK yolları ↔ spec doğrulaması
```

## Sürümleme

Tek `git tag v1.2.3` dört paketi birden yayınlar. Paketler ayrı sürüm numarası taşımaz — hepsi
aynı API sürümünü hedefler.

## Lisans

MIT
