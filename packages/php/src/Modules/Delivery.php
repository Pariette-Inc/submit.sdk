<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/**
 * Genel teslimat — ziyaretçiye gösterilen her şey.
 *
 * Yalnızca site token'ı ister, oturum gerekmez. Sunucuda önbelleklenir ve
 * yalnızca yayımlanmış içeriği döner. Site önyüzü kuruyorsanız gereken bu.
 *
 * ```php
 * $sdk = new SubmitCms(['mode' => 'production', 'token' => env('SUBMIT_TOKEN')]);
 * $posts = $sdk->delivery->records('blog', ['per_page' => 10, 'locale' => 'tr']);
 * ```
 */
final class Delivery extends Module
{
    /** @param array<string,mixed> $params */
    public function records(string $typeCode, array $params = []): mixed
    {
        return $this->client->get('/api/public/records/' . $this->seg($typeCode), $params);
    }

    /** @param array<string,mixed> $params */
    public function record(string $typeCode, string $slug, array $params = []): mixed
    {
        return $this->client->get('/api/public/records/' . $this->seg($typeCode) . '/item/' . $this->seg($slug), $params);
    }

    /** "Bunlar da ilginizi çekebilir" — ilgili kayıtlar. */
    public function alsoRead(string $typeCode, string $slug): mixed
    {
        return $this->client->get('/api/public/records/' . $this->seg($typeCode) . '/item/' . $this->seg($slug) . '/also-read');
    }

    /** Görüntülenme kaydeder. `$duration` saniye cinsinden okuma süresi. */
    public function ping(string $typeCode, string $slug, int $duration = 0): mixed
    {
        return $this->client->post('/api/public/records/' . $this->seg($typeCode) . '/item/' . $this->seg($slug) . '/ping', compact('duration'));
    }

    public function schema(string $typeCode): mixed
    {
        return $this->client->get('/api/public/records/' . $this->seg($typeCode) . '/schema');
    }

    public function categories(): mixed
    {
        return $this->client->get('/api/public/categories');
    }

    public function category(string $slug): mixed
    {
        return $this->client->get('/api/public/categories/' . $this->seg($slug));
    }

    /** Menüyü çözülmüş ağaç olarak döner. */
    public function menu(string $code): mixed
    {
        return $this->client->get('/api/public/menus/' . $this->seg($code));
    }

    /** Önyüzün açılışta ihtiyaç duyduğu her şey tek istekte. */
    public function init(): mixed
    {
        return $this->client->get('/api/public/init');
    }

    public function environment(string $token): mixed
    {
        return $this->client->get('/api/public/environment/' . $this->seg($token));
    }

    public function navigation(string $slug): mixed
    {
        return $this->client->get('/api/public/navigation/' . $this->seg($slug));
    }

    public function banners(): mixed
    {
        return $this->client->get('/api/public/banners');
    }

    public function gallery(string $slug): mixed
    {
        return $this->client->get('/api/public/gallery/' . $this->seg($slug));
    }

    /** @param array<string,mixed> $params */
    public function products(array $params = []): mixed
    {
        return $this->client->get('/api/public/products', $params);
    }

    public function product(string $slug): mixed
    {
        return $this->client->get('/api/public/product/' . $this->seg($slug));
    }

    public function productCategory(string $slug): mixed
    {
        return $this->client->get('/api/public/product-categories/' . $this->seg($slug));
    }

    public function productCollection(int|string $id): mixed
    {
        return $this->client->get('/api/public/product-collection/' . $this->seg($id));
    }

    /**
     * Canvas — v2 şemasından önceki içerik modeli. Yeni projelerde `records()`
     * kullanın; bunlar eski siteler için ayakta.
     *
     * @param array<string,mixed> $params
     */
    public function canvasList(array $params = []): mixed
    {
        return $this->client->get('/api/public/canvas', $params);
    }

    public function canvas(string $slug): mixed
    {
        return $this->client->get('/api/public/canvas/' . $this->seg($slug));
    }

    public function canvasCollection(int|string $id): mixed
    {
        return $this->client->get('/api/public/collection/' . $this->seg($id));
    }

    /** @param array<string,mixed> $params */
    public function documents(array $params = []): mixed
    {
        return $this->client->get('/api/documents', $params);
    }

    public function document(string $slug): mixed
    {
        return $this->client->get('/api/documents/' . $this->seg($slug));
    }

    public function documentCollection(int|string $id): mixed
    {
        return $this->client->get('/api/documents/collection/' . $this->seg($id));
    }

    /** @param array<string,mixed> $params */
    public function documentProducts(array $params = []): mixed
    {
        return $this->client->get('/api/documents/products', $params);
    }

    /**
     * Mevcut bir ticket'a mesaj ekler.
     *
     * Adı yanıltıcıdır ve sürüm uyumu için korunuyor: bu uç form şeması dönmez
     * (`NotificationController@setTicketContent`), `ticket` ve `message`
     * alanlarını zorunlu tutar. Yeni talep açmak için submitTicket() kullanın.
     *
     * @param array{ticket:int|string,message:string} $payload
     */
    public function ticketForm(array $payload = []): mixed
    {
        return $this->client->post('/api/public/ticket-content', $payload);
    }

    /**
     * Yeni iletişim/destek talebi açar.
     *
     * Zorunlu alanlar: type, subject, user, name, email, gdpr, advertising, drp.
     * Eksik gönderimde 422 döner ve errors içinde alan adları listelenir.
     *
     * @param array<string,mixed> $payload
     */
    public function submitTicket(array $payload): mixed
    {
        return $this->client->post('/api/public/ticket-submit', $payload);
    }

    public function notifications(string $token): mixed
    {
        return $this->client->get('/api/public/notification/' . $this->seg($token));
    }

    /**
     * Sitemap adresi. XML olduğu için ayrıştırılmaz — Search Console'a verin
     * ya da `robots.txt`'e yazın. Token sorguda taşınır ki başlık ekleyemeyen
     * araçlar da kullanabilsin.
     */
    public function sitemapUrl(string $envToken): string
    {
        return $this->client->baseUrl() . '/api/public/sitemap.xml?env=' . rawurlencode($envToken);
    }

    /** Siteye özel, her zaman güncel entegrasyon rehberi. */
    public function manifest(): mixed
    {
        return $this->client->get('/api/public/manifest');
    }

    /** `llms.txt` — yapay zekâ araçları için düz metin (JSON zarfı yok). */
    public function llmsTxt(): string
    {
        return $this->client->raw('/api/public/llms.txt');
    }
}
