<?php

declare(strict_types=1);

namespace SubmitCms\Sdk;

use SubmitCms\Sdk\Modules\Addresses;
use SubmitCms\Sdk\Modules\Ai;
use SubmitCms\Sdk\Modules\Auth;
use SubmitCms\Sdk\Modules\Billing;
use SubmitCms\Sdk\Modules\Cart;
use SubmitCms\Sdk\Modules\Categories;
use SubmitCms\Sdk\Modules\ContentTypes;
use SubmitCms\Sdk\Modules\CustomerOrders;
use SubmitCms\Sdk\Modules\Delivery;
use SubmitCms\Sdk\Modules\Locales;
use SubmitCms\Sdk\Modules\Menus;
use SubmitCms\Sdk\Modules\Orders;
use SubmitCms\Sdk\Modules\Partner;
use SubmitCms\Sdk\Modules\Payments;
use SubmitCms\Sdk\Modules\Platform;
use SubmitCms\Sdk\Modules\Records;
use SubmitCms\Sdk\Modules\Schema;
use SubmitCms\Sdk\Modules\Shopping;
use SubmitCms\Sdk\Modules\Storage;
use SubmitCms\Sdk\Modules\System;
use SubmitCms\Sdk\Modules\Tracking;

/**
 * SubmitCMS SDK giriş noktası.
 *
 * ```php
 * use SubmitCms\Sdk\SubmitCms;
 *
 * $sdk = new SubmitCms([
 *     'mode'   => 'production',
 *     'token'  => getenv('SUBMIT_TOKEN'),
 *     'locale' => 'tr',
 * ]);
 *
 * // Ziyaretçiye içerik — oturum gerekmez
 * $posts = $sdk->delivery->records('blog', ['per_page' => 10]);
 *
 * // Panel işlemleri — önce giriş
 * $sdk->auth->console('admin@site.com', 'parola');
 * $sdk->records->create('blog', [
 *     'data' => ['baslik' => 'Merhaba'],
 *     'status' => 'published',
 * ]);
 * ```
 *
 * Hangi modülü ne zaman:
 *
 * | Ne yapıyorsunuz              | Modül                            | Kimlik                          |
 * |------------------------------|----------------------------------|---------------------------------|
 * | Site önyüzü                  | `delivery`                       | site token'ı                    |
 * | İçerik yazma                 | `records`, `contentTypes`, `menus` | token + oturum                |
 * | Mağaza sepeti                | `cart`                           | site token'ı                    |
 * | Sipariş yönetimi             | `orders`                         | token + oturum + `orders` modülü |
 * | Müşteri kendi sitesini yönetiyor | `platform`                   | token + oturum + üyelik         |
 * | Bayi paneli                  | `partner`                        | partner oturumu                 |
 */
final class SubmitCms
{
    public readonly Client $client;

    public readonly Auth $auth;
    public readonly Delivery $delivery;

    public readonly Records $records;
    public readonly ContentTypes $contentTypes;
    public readonly Categories $categories;
    public readonly Locales $locales;
    public readonly Schema $schema;
    public readonly Menus $menus;

    public readonly Cart $cart;
    public readonly Shopping $shopping;
    public readonly Orders $orders;
    public readonly CustomerOrders $myOrders;
    public readonly Addresses $addresses;
    public readonly Payments $payments;
    public readonly Billing $billing;

    public readonly Platform $platform;
    public readonly Partner $partner;

    public readonly Ai $ai;
    public readonly Storage $storage;
    public readonly Tracking $tracking;
    public readonly System $system;

    /**
     * @param array{
     *     mode?: 'production'|'test',
     *     token: string,
     *     locale?: string,
     *     timeout?: int,
     *     baseUrl?: string,
     *     retries?: int,
     *     retryBaseDelayMs?: int,
     * }|Client $config
     */
    public function __construct(array|Client $config)
    {
        $this->client = $config instanceof Client ? $config : new Client($config);

        $this->auth = new Auth($this->client);
        $this->delivery = new Delivery($this->client);

        $this->records = new Records($this->client);
        $this->contentTypes = new ContentTypes($this->client);
        $this->categories = new Categories($this->client);
        $this->locales = new Locales($this->client);
        $this->schema = new Schema($this->client);
        $this->menus = new Menus($this->client);

        $this->cart = new Cart($this->client);
        $this->shopping = new Shopping($this->client);
        $this->orders = new Orders($this->client);
        $this->myOrders = new CustomerOrders($this->client);
        $this->addresses = new Addresses($this->client);
        $this->payments = new Payments($this->client);
        $this->billing = new Billing($this->client);

        $this->platform = new Platform($this->client);
        $this->partner = new Partner($this->client);

        $this->ai = new Ai($this->client);
        $this->storage = new Storage($this->client);
        $this->tracking = new Tracking($this->client);
        $this->system = new System($this->client);
    }

    /** Oturum token'ını elle yazar — saklanan JWT'yi geri yüklerken. */
    public function setAuthToken(?string $token): void
    {
        $this->client->setAuthToken($token);
    }

    /** Aktif siteyi değiştirir (`EnvToken`). Çok siteli panellerde. */
    public function setEnvironment(?string $token): void
    {
        $this->client->setEnvironment($token);
    }

    public function setLocale(string $locale): void
    {
        $this->client->setLocale($locale);
    }

    /** Misafir sepeti kimliği. */
    public function setGuestId(?string $guestId): void
    {
        $this->client->setGuestId($guestId);
    }

    /**
     * Modüllere metot çağrısıyla da erişilebilsin diye.
     *
     * Laravel facade'i statik çağrıları örneğin **metotlarına** yönlendirir,
     * özelliklerine değil. Bu sayede `SubmitCms::records()->list('blog')`
     * çalışır; doğrudan kullanımda `$sdk->records->list('blog')` de geçerlidir.
     *
     * @param  list<mixed>  $arguments
     */
    public function __call(string $name, array $arguments): mixed
    {
        if (property_exists($this, $name)) {
            return $this->{$name};
        }

        throw new \BadMethodCallException(sprintf('%s::%s() diye bir şey yok.', static::class, $name));
    }
}
