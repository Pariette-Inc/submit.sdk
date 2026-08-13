<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/**
 * İçerik kayıtları — v2 şema sisteminin ana modülü (yazma tarafı).
 *
 * Ziyaretçiye içerik göstermek için `$sdk->delivery` kullanın; orası oturum
 * istemez ve yalnızca yayımlanmışları döner.
 *
 * Gövde şeması:
 * ```php
 * [
 *   'data'   => ['baslik' => 'Merhaba', 'icerik' => '...'],  // tipin özel alanları
 *   'status' => 'published',        // draft | published | archived
 *   'locale' => 'tr',               // sitenin dil listesinde olmalı
 *   'slug'   => 'merhaba',          // verilmezse üretilir
 *   'categories' => [3, 7],
 *   'seo'    => ['meta_title' => '...', 'meta_description' => '...'],
 *   'commerce' => ['price' => 199.90, 'stock' => 12],  // yalnızca ürün tiplerinde
 * ]
 * ```
 */
final class Records extends Module
{
    /**
     * Kayıtları listeler.
     *
     * Filtre işleçleri: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `like`, `in`.
     *
     * ```php
     * $sdk->records->list('urun', [
     *     'status' => 'published',
     *     'filter' => ['price' => ['gte' => 100]],
     *     'sort' => 'price', 'dir' => 'asc',
     * ]);
     * ```
     *
     * @param array<string,mixed> $params
     */
    public function list(string $typeCode, array $params = []): mixed
    {
        return $this->client->get('/api/schema/records/' . $this->seg($typeCode), $params);
    }

    public function get(string $typeCode, int $id): mixed
    {
        return $this->client->get('/api/schema/records/' . $this->seg($typeCode) . '/' . $id);
    }

    /** @param array<string,mixed> $payload */
    public function create(string $typeCode, array $payload): mixed
    {
        return $this->client->post('/api/schema/records/' . $this->seg($typeCode), $payload);
    }

    /** @param array<string,mixed> $payload */
    public function update(string $typeCode, int $id, array $payload): mixed
    {
        return $this->client->put('/api/schema/records/' . $this->seg($typeCode) . '/' . $id, $payload);
    }

    /**
     * Kaydı ÇÖP KUTUSUNA taşır (2026-08-13'ten beri iki aşamalı).
     *
     * Varsayılan silme kalıcı DEĞİLDİR: kayıt siteden düşer, 30 gün içinde
     * `restoreFromTrash()` ile geri alınabilir, süre dolunca sunucudaki
     * `records:prune` görevi kalıcı siler.
     *
     * `$force = true` kalıcı siler ve YALNIZ şirket yöneticisinde çalışır;
     * yetkisi olmayan çağrı 403 döner (sessizce çöpe düşmez).
     */
    public function delete(string $typeCode, int $id, bool $force = false): mixed
    {
        $path = '/api/schema/records/' . $this->seg($typeCode) . '/' . $id;

        return $this->client->delete($force ? $path . '?force=1' : $path);
    }

    /**
     * Çöp kutusu: silinmiş ama henüz kalıcı silinmemiş kayıtlar.
     *
     * `meta.can_purge` çağıran kullanıcının kalıcı silme yetkisi olup olmadığını
     * söyler; arayüz "Kalıcı sil" düğmesini buna bakarak çizmelidir.
     *
     * @param array{page?:int,per_page?:int} $params
     */
    public function trash(string $typeCode, array $params = []): mixed
    {
        return $this->client->get('/api/schema/records/' . $this->seg($typeCode) . '/trash', $params);
    }

    /**
     * Kaydı çöp kutusundan geri getirir.
     *
     * Adres çakışması sunucuda çözülür: kayıt çöpteyken slug'ı başkasına
     * verilmiş olabilir; geri gelen kayıt CANLI sayfanın adresini almaz,
     * kendine yeni adres alır. Filtre indeksi de bu sırada yeniden kurulur.
     */
    public function restoreFromTrash(string $typeCode, int $id): mixed
    {
        return $this->client->post('/api/schema/records/' . $this->seg($typeCode) . '/' . $id . '/restore', []);
    }

    public function analytics(string $typeCode, int $id): mixed
    {
        return $this->client->get('/api/schema/records/' . $this->seg($typeCode) . '/' . $id . '/analytics');
    }

    public function revisions(string $typeCode, int $id): mixed
    {
        return $this->client->get('/api/schema/records/' . $this->seg($typeCode) . '/' . $id . '/revisions');
    }

    public function revision(string $typeCode, int $id, int $version): mixed
    {
        return $this->client->get('/api/schema/records/' . $this->seg($typeCode) . '/' . $id . '/revisions/' . $version);
    }

    /** Kaydı o sürüme döndürür; mevcut hâl önce anlık görüntüye alınır. */
    public function restoreRevision(string $typeCode, int $id, int $version): mixed
    {
        return $this->client->post('/api/schema/records/' . $this->seg($typeCode) . '/' . $id . '/revisions/' . $version . '/restore');
    }

    public function gallery(string $typeCode, int $id, string $field): mixed
    {
        return $this->client->get('/api/schema/records/' . $this->seg($typeCode) . '/' . $id . '/gallery/' . $this->seg($field));
    }

    /** @param array<string,mixed> $payload */
    public function addGalleryImage(string $typeCode, int $id, string $field, array $payload): mixed
    {
        return $this->client->post('/api/schema/records/' . $this->seg($typeCode) . '/' . $id . '/gallery/' . $this->seg($field), $payload);
    }

    /** @param list<int> $order */
    public function reorderGallery(string $typeCode, int $id, string $field, array $order): mixed
    {
        return $this->client->put('/api/schema/records/' . $this->seg($typeCode) . '/' . $id . '/gallery/' . $this->seg($field) . '/order', compact('order'));
    }

    /** @param array<string,mixed> $payload */
    public function updateGalleryImage(string $typeCode, int $id, string $field, int $imageId, array $payload): mixed
    {
        return $this->client->put('/api/schema/records/' . $this->seg($typeCode) . '/' . $id . '/gallery/' . $this->seg($field) . '/' . $imageId, $payload);
    }

    public function removeGalleryImage(string $typeCode, int $id, string $field, int $imageId): mixed
    {
        return $this->client->delete('/api/schema/records/' . $this->seg($typeCode) . '/' . $id . '/gallery/' . $this->seg($field) . '/' . $imageId);
    }

    /**
     * Metni iyileştirir. AI kredisi harcar — bakiye yetmezse 402.
     *
     * @param array<string,mixed> $payload
     */
    public function aiImprove(string $typeCode, int $id, array $payload = []): mixed
    {
        return $this->client->post('/api/schema/records/' . $this->seg($typeCode) . '/' . $id . '/ai/improve', $payload);
    }

    /** @param array<string,mixed> $payload */
    public function aiSeo(string $typeCode, int $id, array $payload = []): mixed
    {
        return $this->client->post('/api/schema/records/' . $this->seg($typeCode) . '/' . $id . '/ai/seo', $payload);
    }

    /** Kaydı hedef dile çevirip kardeş kayıt olarak bağlar. */
    public function aiTranslate(string $typeCode, int $id, string $locale): mixed
    {
        return $this->client->post('/api/schema/records/' . $this->seg($typeCode) . '/' . $id . '/ai/translate', compact('locale'));
    }
}
