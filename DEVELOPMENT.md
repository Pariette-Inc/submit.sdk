# Geliştirme Kaydı

> Her ekran/servis geliştirmesinden sonra güncellenir. En yeni bölüm en üstte.
> Format: development-log skill'i (Claude) tarafından otomatik bakılır.

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
