# submitcms

SubmitCMS'in resmî JavaScript/TypeScript istemcisi. Node.js 18+ ve tarayıcı.

```bash
npm i submitcms
```

```ts
import { SubmitCms } from 'submitcms'

const sdk = new SubmitCms({
  mode: 'production',           // isteğe bağlı: varsayılan 'production', ya da 'test'
  token: process.env.SUBMIT_TOKEN!,
  locale: 'tr',
})

// Ziyaretçiye içerik — oturum gerekmez
const { data, meta } = await sdk.delivery.records('blog', { per_page: 10 })

// Panel işlemleri — önce giriş
await sdk.auth.console({ email, password })
await sdk.records.create('blog', {
  data: { baslik: 'Merhaba' },
  status: 'published',
})
```

## Diller

`locale` her yazımda kabul edilir: `tr`, `tr-TR`, `tr_TR`; `en`, `en-US`, `us`. API onu sitenin
kayıtlı koduna çevirir (sitede `en` varsa `en-US` → `en`). Doğru kodlar ve bayraklar için katalog:

```ts
const { data } = await sdk.locales.catalog()      // [{ code: 'tr_TR', bcp47: 'tr-TR', short: 'tr', flag: '🇹🇷', native: 'Türkçe', aliases: [...] }, ...]
await sdk.locales.add('en_US')                     // sitede "en" olarak kaydedilir, adı "English"
```

## İki tür kimlik

**Site token'ı** hangi siteye bağlandığınızı söyler; gizli değildir, her istekte
`SubmitToken` başlığıyla gider. **Oturum (JWT)** kullanıcının kim olduğunu söyler;
`auth.login()` sonrası SDK bunu kendisi yazar.

Çok siteli panellerde `sdk.setEnvironment(token)` ile aktif siteyi değiştirin —
`EnvToken` başlığı yapılandırmadaki token'ı ezer.

## Taşıma katmanı

- 401'de otomatik JWT yenileme (`onTokenRefresh` verirseniz), eşzamanlı istekler kuyruğa alınır
- Ağ ve 5xx hatalarında üstel bekleyerek yeniden deneme
- 429'da `Retry-After` süresine saygı — üstel geri çekilme uygulanmaz
- Aynı GET'in paralel çağrılarını tekilleştirme
- `sdk.client.on('auth:expired' | 'error:rate-limit' | …)` olayları
- `mock: true` ile ağa çıkmadan fixture yanıt

## Medya adresleri

Yalnız `token` zorunludur. API kökü (`https://live.submitcms.com`) ve medya CDN'i
(`https://cdn.submitcms.com`) SDK'dan gelir. Kayıtlardaki görsel alanları CDN'e göre yoldur;
tam adres için `media()` kullanın:

```ts
sdk.media(record.data.image_web)   // 'site/a.webp' → 'https://cdn.submitcms.com/site/a.webp'
sdk.media('')                      // ''  (boş yol boş kalır)
sdk.media('https://x.test/a.png')  // tam adres aynen döner
sdk.cdnUrl                         // 'https://cdn.submitcms.com'  (CDN_URL sabiti de dışa açık)

new SubmitCms({ token, cdnUrl: 'http://localhost:9000' })  // yerel kopya veya kendi CDN'iniz
```

## Toplu okuma

Aynı anda yapılan `sdk.delivery` okumaları kendiliğinden gruplanır: 50 çağrı 50 istek değil, en çok 25 parçalık birkaç `POST /api/public/batch` isteği olur. Kod değişmez.

```ts
const [footer, news] = await Promise.all([
  sdk.delivery.record('page', 'footer'),     // ikisi tek istekte gider
  sdk.delivery.records('blog', { per_page: 3 }),
])
```

- Her çağrı kendi sonucunu alır; bulunamayan kayıt yalnız kendi çağrısında `SubmitError` (404) verir.
- Her parça ayrı gösterim sayılır.
- Ayar: `batch: { wait: 5, max: 25 }` (varsayılan), `batch: false` kapatır. `signal` verilen istek tek başına gider.
- Elle: `sdk.delivery.batch([{ id, path, query }])` → `{ id, status, body }[]`.

## Neler dahil değil

SDK yalnızca **canlı** uçları çağırır. submit.api'deki 507 endpoint'in 201'i
2026-07-30 panel emekliliği kararıyla kapatıldı ve 410 `PANEL_RETIRED` dönüyor;
bunların hiçbiri bu pakette yok. Kontrat testleri her derlemede bunu doğrular.

Kapsam dışı bırakılan canlı uçlar: cron tetikleyicileri, Stripe/Tami webhook
alıcıları ve OAuth yönlendirmeleri — üçü de sunucu-sunucu ya da tarayıcı
yönlendirmesiyle yürüdüğü için istemci kütüphanesine ait değil.

## Dokümantasyon

**https://submitcms.com/sdk** — her modülün her metodu, parametre tabloları,
kimlik gereksinimleri ve dört dilde çalışan örnekler.

## Lisans

MIT
