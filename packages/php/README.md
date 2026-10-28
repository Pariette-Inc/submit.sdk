# submitcms/sdk

SubmitCMS'in resmî PHP istemcisi. PHP 8.2+, Laravel için hazır entegrasyon.

```bash
composer require submitcms/sdk
```

```php
use SubmitCms\Sdk\SubmitCms;

$sdk = new SubmitCms([
    'mode'   => 'production',   // ya da 'test'
    'token'  => getenv('SUBMIT_TOKEN'),
    'locale' => 'tr',
]);

// Ziyaretçiye içerik — oturum gerekmez
$posts = $sdk->delivery->records('blog', ['per_page' => 10]);

// Panel işlemleri — önce giriş
$sdk->auth->console($email, $password);
$sdk->records->create('blog', [
    'data'   => ['baslik' => 'Merhaba'],
    'status' => 'published',
]);
```

## Laravel

Paket keşfiyle otomatik yüklenir.

```bash
php artisan vendor:publish --tag=submitcms-config
```

```env
SUBMITCMS_TOKEN=site_token
SUBMITCMS_MODE=production
SUBMITCMS_LOCALE=tr
```

```php
use SubmitCms\Sdk\SubmitCms;

public function index(SubmitCms $sdk)
{
    return view('blog', ['posts' => $sdk->delivery->records('blog')]);
}
```

Facade de var: `SubmitCms::delivery()->records('blog')`.

## Hatalar

API 4xx/5xx döndüğünde tipli istisna fırlatılır. `errorCode()` backend'in
makine-okunur kodudur (`MODULE_DISABLED`, `ENV_REQUIRED`…) — mesaj değişebilir,
kod değişmez.

```php
use SubmitCms\Sdk\Exception\{ValidationException, ApiException};

try {
    $sdk->records->create('blog', $payload);
} catch (ValidationException $e) {
    return back()->withErrors($e->errors());
} catch (ApiException $e) {
    report($e);
}
```

## Medya adresleri

Yalnız `token` zorunludur. API kökü (`https://live.submitcms.com`) ve medya CDN'i
(`https://cdn.submitcms.com`, `Client::CDN_URL`) SDK'dan gelir. Kayıtlardaki görsel alanları
CDN'e göre yoldur; tam adres için `media()` kullanın:

```php
$sdk->media($record['data']['image_web']);  // 'site/a.webp' → 'https://cdn.submitcms.com/site/a.webp'
$sdk->media('');                            // ''  (boş yol boş kalır)
$sdk->cdnUrl();                             // 'https://cdn.submitcms.com'

new SubmitCms(['token' => $token, 'cdnUrl' => 'http://localhost:9000']);  // Laravel: SUBMITCMS_CDN_URL
```

## Toplu okuma

Birden çok public okumayı tek istekte gönderin (en çok 25 parça). Her parça `{ id, status, body }` olarak döner ve ayrı gösterim sayılır.

```php
$result = $sdk->delivery->batch([
    ['id' => 'footer', 'path' => 'records/page/item/footer'],
    ['id' => 'news',   'path' => 'records/blog', 'query' => ['per_page' => 3]],
]);
```

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

## Diller

`locale` her yazımda kabul edilir: `tr`, `tr-TR`, `tr_TR`; `en`, `en-US`, `us`. API onu sitenin
kayıtlı koduna çevirir. Doğru kodlar ve bayraklar için katalog:

```php
$catalog = $sdk->locales->catalog();   // code tr_TR, bcp47 tr-TR, short tr, flag 🇹🇷, native Türkçe, aliases
$sdk->locales->add('en_US');           // sitede "en" olarak kaydedilir
```
