# Kendi sanal POS'unuzu kullanma

> Sağlayıcıdan bağımsız ödeme bildirimi — sunucudan sunucuya, imzalı.

Submit sipariş yönetimini yapar; **ödemeyi kendi POS'unuzla siz alırsınız.**
Tek şart, sonucu bize bildirmenizdir: sipariş ödendi mi ödenmedi mi
bilinmezse panelde sonsuza kadar "Yeni" kalır, durum maili gitmez ve ciro
raporunuz yanlış olur.

Hangi POS olduğu **fark etmez**: Iyzico, PayTR, Stripe, bankanızın kendi sanal
posu, kapıda ödeme, havale. Hepsi aynı sözleşmeyle bildirilir.

## Neden SDK'da bir metot yok

Bu çağrı bir siparişi "ödendi" işaretleyebiliyor ve ortak bir sırla imzalanıyor.
İstemci SDK'larına (JS tarayıcı tarafı, Swift, Kotlin) bir `reportPayment()`
metodu koymak, o sırrın tarayıcıya ya da mobil uygulamaya gömülmesini teşvik
ederdi — ve sırrı ele geçiren herkes kendi siparişini bedava ödenmiş yapabilirdi.

Bu yüzden bilinçli olarak **SDK yüzeyinin dışında** tutuldu. Çağrı yalnızca
sizin sunucunuzdan yapılmalıdır; aşağıdaki 15 satır zaten yeterli.

## Sözleşme

```
POST {API}/shop/orders/{siparis_no}/payments
SubmitToken: <ortam jetonunuz>
X-Submit-Signature: sha256=<hex(hmac_sha256(ham_govde, sir))>
Content-Type: application/json
```

```json
{
  "provider": "iyzico",
  "provider_reference": "17439201",
  "status": "paid",
  "amount": 249.90,
  "currency": "TRY",
  "raw": { "...": "POS'un ham yanıtı" }
}
```

`status`: `pending` · `authorized` · `paid` · `failed` · `refunded`

Sırrı panelden üretirsiniz: **Konsol → Siparişler → Kendi POS'um**. Sır bir kez
gösterilir; kaybederseniz yenilersiniz (eskisi o an çalışmayı durdurur).

## Davranış

| Durum | Ne olur |
|---|---|
| `paid` / `authorized` + tutar uyuşuyor + sipariş "Yeni" | Sipariş **onaylanır**, durum maili gider |
| Tutar uyuşmuyor | Kayıt düşer, sipariş **onaylanmaz**, panelde işaretlenir |
| Aynı `provider` + `provider_reference` ikinci kez | Yeni kayıt açılmaz, `duplicate: true` döner |
| İmza geçersiz | `401`, kayıt açılmaz, sunucu günlüğüne yazılır |
| Sipariş iptal edilmiş | Kayıt düşer ama durum ilerlemez |

**Tekrar güvenlidir.** POS'lar ağ hatasında callback'i tekrar gönderir; ikinci
istek tek ödemeyi iki ciro satırına dönüştürmez.

## Örnek — PHP

```php
$payload = json_encode([
    'provider'           => 'iyzico',
    'provider_reference' => $pos->paymentId,
    'status'             => 'paid',
    'amount'             => 249.90,
    'currency'           => 'TRY',
    'raw'                => $pos->rawResponse,
]);

$signature = hash_hmac('sha256', $payload, getenv('SUBMIT_PAYMENT_SECRET'));

$ch = curl_init("https://live.submitcms.com/api/shop/orders/{$orderNumber}/payments");
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'SubmitToken: ' . getenv('SUBMIT_ENV_TOKEN'),
        'X-Submit-Signature: sha256=' . $signature,
    ],
]);
curl_exec($ch);
```

## Örnek — Node.js

```js
import crypto from 'node:crypto'

const payload = JSON.stringify({
  provider: 'paytr',
  provider_reference: pos.merchantOid,
  status: 'paid',
  amount: 249.90,
  currency: 'TRY',
  raw: pos.rawResponse,
})

const signature = crypto
  .createHmac('sha256', process.env.SUBMIT_PAYMENT_SECRET)
  .update(payload)          // HAM gövde
  .digest('hex')

await fetch(`https://live.submitcms.com/api/shop/orders/${orderNumber}/payments`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'SubmitToken': process.env.SUBMIT_ENV_TOKEN,
    'X-Submit-Signature': `sha256=${signature}`,
  },
  body: payload,
})
```

## En sık yapılan hata

İmzayı **ayrıştırılmış nesneden** hesaplamak:

```js
// YANLIŞ — yeniden kodlama anahtar sırasını ve boşlukları değiştirir
crypto.createHmac('sha256', secret).update(JSON.stringify(JSON.parse(payload)))

// DOĞRU — gövdeyi bir kez üretin, hem imzalayın hem gönderin
const payload = JSON.stringify(data)
crypto.createHmac('sha256', secret).update(payload)
```
