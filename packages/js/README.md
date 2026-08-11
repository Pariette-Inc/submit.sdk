# submitcms

SubmitCMS'in resmî JavaScript/TypeScript istemcisi. Node.js 18+ ve tarayıcı.

```bash
npm i submitcms
```

```ts
import { SubmitCms } from 'submitcms'

const sdk = new SubmitCms({
  mode: 'production',           // ya da 'test'
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
