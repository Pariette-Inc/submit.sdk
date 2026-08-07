<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/**
 * Menüler — site gezinmesi.
 *
 * Ağaç `items` içinde iç içe tutulur. Ziyaretçiye çözülmüş hâlini
 * `$sdk->delivery->menu($code)` ile verin.
 *
 * ```php
 * $sdk->menus->update('ana-menu', ['items' => [
 *     ['label' => 'Anasayfa', 'url' => '/'],
 *     ['label' => 'Blog', 'type' => 'blog', 'children' => [
 *         ['label' => 'Tümü', 'url' => '/blog'],
 *     ]],
 * ]]);
 * ```
 */
final class Menus extends Module
{
    public function list(): mixed
    {
        return $this->client->get('/api/menus');
    }

    public function get(string $code): mixed
    {
        return $this->client->get('/api/menus/' . $this->seg($code));
    }

    /** @param array<string,mixed> $payload */
    public function create(array $payload): mixed
    {
        return $this->client->post('/api/menus', $payload);
    }

    /** @param array<string,mixed> $payload */
    public function update(string $code, array $payload): mixed
    {
        return $this->client->put('/api/menus/' . $this->seg($code), $payload);
    }

    public function delete(string $code): mixed
    {
        return $this->client->delete('/api/menus/' . $this->seg($code));
    }

    /** Ağacı kaydetmeden çözer — kırık bağlantıları yayına almadan görmek için. */
    public function preview(string $code): mixed
    {
        return $this->client->get('/api/menus/' . $this->seg($code) . '/preview');
    }

    public function revisions(string $code): mixed
    {
        return $this->client->get('/api/menus/' . $this->seg($code) . '/revisions');
    }

    public function restore(string $code, int $version): mixed
    {
        return $this->client->post('/api/menus/' . $this->seg($code) . '/restore/' . $version);
    }
}
