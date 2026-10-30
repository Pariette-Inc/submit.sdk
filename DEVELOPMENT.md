# Geliştirme Kaydı

> Her ekran/servis geliştirmesinden sonra güncellenir. En yeni bölüm en üstte.
> Format: development-log skill'i (Claude) tarafından otomatik bakılır.

## 2026-10-30 — `platform.mailSetup`: kiracı kendi adresinden gönderir

- Dört pakete de eklendi (js `platform.mailSetup`, php `mailSetup/ensureMailSetup/verifyMailSetup/setMailRelay`, kotlin ve swift aynı adlarla).
- Uçlar: `GET|POST|PUT /api/platform/my/sites/{id}/mail-setup` ve `POST .../mail-setup/verify`.
- Akış: `ensure()` Signalbird'de alan adını açar → `status()` DNS kayıtlarını döner → müşteri kendi DNS'ine yazar → `verify()`. Doğrulanmadan o alan adı adına gönderim kapalıdır.
- `preference('own_smtp')` (php `setMailRelay`): müşteri Signalbird'ü reddeder, postası kendi SMTP'sinden çıkar. Anayasa 6'nın tek istisnası (anayasa 14).
- `spec/endpoints.json` yeniden üretildi. Önceki üretim `feat/public-batch` dalındaydı ve `test`'teki 6 uç (module-catalog, my/company, my/site-catalog, my/sites-overview, my/sites/{id}/status) spec'e hiç girmemişti; bu üretim onları da getirdi.
- `pnpm test:contract` 15/15, `packages/js` typecheck temiz.

## 2026-10-29 — Kayıt gövdesi: `account_type`, `company_name` (anayasa 13)

- **Neden:** submit.api kayıt ucu artık üyeyle birlikte bir şirket açıyor (anayasa 13, Ahmet 2026-10-29). Gövde iki alan daha taşır; anayasa 9 gereği aynı işte SDK'ya işlendi.
- **js:** `RegisterPayload` → `account_type?: 'individual' | 'corporate'`, `company_name?: string`. Kırıcı değişiklik değil: iki alan da isteğe bağlı, verilmezse API bireysel sayar.
- **php, swift, kotlin:** `register` serbest gövde alır; metot açıklamaları iki alanı ve şirket kuralını anlatır.
- `spec/endpoints.json`: dal `main` ile birleştirilirken spec dosyası `main`'inki alındı. 30 Ekim üretimi `test` dalından yapıldığı için bu dalın getirdiği her satırı zaten taşıyor ve daha günceldir.
- `submit.web/src/data/sdk-reference.json` yeniden üretildi (`docs:publish`).
- Test: `pnpm test:contract` (15), `pnpm typecheck`. Sürüm yükseltilmedi; yayın sahibin işi.

- Not: `submitcms/_shared/2026-10/2026-10-29-company-at-register.html`

## 2026-10-28 — Medya CDN varsayılanı: `media()`, `cdnUrl`; JS `mode` isteğe bağlı

- **Amaç:** Siteye yalnız site token'ı yazılsın. API kökü ve medya CDN'i SDK'dan gelsin (Ahmet, 2026-10-28; WUX `NEXT_PUBLIC_SUBMITCMS_API_URL` ve `NEXT_PUBLIC_CDN_URL` ayarlarını elle istiyordu).
- **Yeni sabit:** CDN kökü `https://cdn.submitcms.com` — js `CDN_URL`, php `Client::CDN_URL`, swift `submitCDNURL`, kotlin `SubmitClient.CDN_URL`.
- **Yeni ayar:** `cdnUrl` (js, php, kotlin), `cdnURL` (swift); Laravel `cdn_url` / `SUBMITCMS_CDN_URL`. Yerel kopya veya kendi CDN'i için.
- **Yeni metot:** `media(path)` ve `cdnUrl` (giriş sınıfı ve istemci, dört paket). Yol CDN köküne eklenir; boş yol boş metin, tam adres (`https://`, `//`, `data:`) aynen döner. js ayrıca `mediaUrl(cdnUrl, path)` dışa açık.
- **JS:** `mode` artık isteğe bağlı (varsayılan `production`). PHP, Swift, Kotlin zaten varsayılan veriyordu.
- **Test:** `packages/js/test/media.test.mjs` (4 test); `npm test` 10/10. PHP elle çalıştırılarak denendi; Swift `swift build` geçti; Kotlin derlenmedi (makinede gradle yok).
- API değişikliği yok; `spec/endpoints.json` değişmedi.
- Sürüm: minor (yeni özellik, kırıcı değişiklik yok). Sahibi yayınlar.

## 2026-10-28 — Toplu okuma: aynı anda yapılan public GET'ler tek istekte

- **JS (otomatik):** `/api/public/*` GET'leri kısa pencerede birikir, `POST /api/public/batch` ile en fazla 25'lik paketlerde gider. Ayar `batch: { wait: 5, max: 25 } | false` (varsayılan açık). Her çağrı kendi sonucunu alır; parça hatası `SubmitError` (ör. 404) olarak yalnız o çağrıya düşer. Tek çağrı, `signal` verilen çağrı ve mock modu gruplanmaz. API toplu ucu tanımazsa (404/405/410) istemci tek isteklere döner.
- **Yeni metot:** `delivery.batch(items)` (js, php, swift, kotlin) — elle toplu okuma, yanıt `{ id, status, body }[]`.
- **Yeni tipler (js):** `BatchConfig`, `BatchItem`, `BatchItemResult`.
- **Test:** `packages/js/test/batch.test.mjs` (6 test, `npm test`: derler + `node --test`). `pnpm test:contract` 15/15.
- `spec/endpoints.json` submit.api `feat/public-batch`'ten yeniden üretildi (+1 uç).
- Kotlin derlenmedi (makinede gradle yok); Swift `swift build` geçti, PHP `php -l` geçti.
- Sürüm: minor (yeni özellik, kırıcı değişiklik yok). Sahibi yayınlar; API önce yayına çıkmalı.

## 2026-10-26 — GET sorgu parametreleri ve dil başına adres

- **Hata (JS):** 21 modül çağrısı sorgu nesnesini `{ params }` diye sarıyordu; `client.get()` ikinci argümanı zaten sorgu olduğu için istek `params[per_page]=…` gidiyor, `per_page`, `locale`, `category`, `filter`, `sort` sunucuda yok sayılıyordu (`delivery.records`, `records.list`, sipariş, ödeme, rezervasyon, platform listeleri). Düzeltildi; kontrat testine "GET çağrıları sorgu parametrelerini sarmaz" eklendi. PHP, Swift, Kotlin paketlerinde hata yok.
- **Belge:** `delivery.record` (dört paket) — her dilin kendi adresi var; adres o dilde yoksa `canonical_slug` olarak aranır (submit.api 2026-10-26).
- Sürüm: patch (kırıcı değişiklik yok).

## 2026-10-25 — Dil kataloğu: `locales.catalog()`, takma kodlar

- Yeni uç: `GET /api/schema/locales/catalog` → `locales.catalog()` (js, php, swift, kotlin). Dünya dilleri: doğru kod (`tr_TR`), web biçimi (`tr-TR`), kısa kod (`tr`), ad, yerel ad, bayrak, kabul edilen yazımlar.
- `locales.add(code, { label? })`: kod her yazımda kabul edilir (`tr_TR`, `us`…), API kısa koda çevirir; `label` isteğe bağlı.
- `locales.list()` tipi düzeltildi: yanıt `{ locales: SiteLocale[], default }` (js tipi diziydi; swift `[JSONValue]` çözümü bu yanıtta başarısızdı). `SiteLocale` yeni alanlar: `locale`, `bcp47`, `flag`, `native`.
- `spec/endpoints.json` submit.api `feat/pariette-migration-users`'tan (test tabanı) yeniden üretildi: önceki üretim `test@f86dda8` idi, `test`'teki 21 uç spec'te yoktu.
- README (4 paket): "Diller" bölümü. `pnpm test:contract` 14/14, `submit check sdk` geçti.
- Sürüm: sahibi yayınlar (`release.sh`).

## 2026-10-19 — Kurallar meta repoda (`../submitcms/`)

- `CLAUDE.md` artık yalnız `../submitcms/AGENTS.md` ve `../submitcms/submit.sdk/RULES.md`'yi yükler.
- Bu repoda `test` dalı yok: görev dalı `main`'den açılır, `submit ship` `main`'e PR açar.
- `AGENTS.md` (Codex), `.claude/settings.json` (push koruma kancası, yasak dal listesi), PR şablonu eklendi.
- Deploy adımı: yok.

## 2026-08-13 — Rezervasyon modülü + çöp kutusu uçları (dört dil)

> `submit.api`'ye gelen rezervasyon modülü ve iki aşamalı içerik silme SDK'lara
> işlendi. Kontrat testi dört istemcinin AYNI yüzeyi kapsamasını zorunlu tuttuğu
> için JS/PHP/Swift/Kotlin birlikte güncellendi — biri eksik kalsaydı
> `tests/contract` kırmızıya düşerdi.
>
> **Silme sözleşmesi değişti:** `records.delete()` artık çöp kutusuna taşır.
> Kalıcı silme `force` bayrağı ister ve yalnız şirket yöneticisinde çalışır.
> Yeni `records.trash()` ve `records.restoreFromTrash()` eklendi.
>
> **Referans üreticisinde iki hata düzeltildi** (`scripts/generate-reference.mjs`):
>
>  1. Metot gövdesi sabit 900 karakterlik pencereden okunuyordu; uzun JSDoc'u
>     olan metotlar (ör. `delivery.reservations.book`) çağrı satırına ulaşamadan
>     pencereyi doldurup dokümandan SESSİZCE düşüyordu. Sınır artık bir sonraki
>     üye bildirimi — `methodNamesByPath` bu dersi zaten almıştı, JS ayrıştırıcısı
>     geride kalmıştı.
>  2. `readonly x = { … }` grubu bir kez atanınca sınıfın SONUNA kadar yapışıyordu:
>     `documents` bloğundan sonraki `manifest()` dokümana `documents.manifest`
>     diye giriyordu. Grup artık nesnenin kapanış parantezinde bitiyor. Parantez
>     sayacı yorumları ve dizeleri atlıyor — TÜRKÇE YORUMLARDAKİ KESME İŞARETİ
>     ("12'sinde") naif bir tarayıcıda dize başlangıcı sanılıp araya giren kodu
>     yutuyordu.
>
> Sonuç: 7 metodun yanlış grup öneki düzeldi, çağrı yapmayan 3 adres kurucu
> (`googleRedirectUrl`, `sitemapUrl`, `receipts.pdfUrl`) bir sonraki metodun
> ucuyla etiketlenmekten kurtuldu.

| Modül | JS | PHP | Swift | Kotlin | Not |
|---|---|---|---|---|---|
| Rezervasyon (panel) | `sdk.reservations` | `$sdk->reservations` | `sdk.reservations` | `sdk.reservations` | yeni — 15 metot: gelen kutusu, takvim, müsaitlik, ayarlar, kapalı tarihler, sezon fiyatı |
| Rezervasyon (ziyaretçi) | `sdk.delivery.reservations.*` | `$sdk->delivery->reservationAvailability/reservationCalendar/book` | `sdk.delivery.reservationAvailability/…` | `sdk.delivery.reservationAvailability/…` | yeni — kalan kapasite SIZDIRMAZ |
| Kayıt çöp kutusu | `records.trash` / `records.restoreFromTrash` | `trash` / `restoreFromTrash` | `trash` / `restoreFromTrash` | `trash` / `restoreFromTrash` | yeni |
| Kayıt silme | `records.delete(type, id, { force })` | `delete($type, $id, $force)` | `delete(_:id:force:)` | `delete(typeCode, id, force)` | güncellendi — varsayılan çöp kutusu |

| Üretilen dosya | Komut | Not |
|---|---|---|
| `spec/endpoints.json` | `pnpm spec:generate --api-path ../submit.api` | 475 uç / 275 canlı |
| `docs/reference.json` | `pnpm docs:generate` | 23 modül / 227 metot |
| `submit.web/src/data/sdk-reference.json` | `pnpm docs:publish` | `/Documents` sayfasını besler |
