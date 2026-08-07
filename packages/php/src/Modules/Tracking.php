<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/**
 * Ziyaretçi takibi ve hata bildirimi. Site token'ı yeter, oturum gerekmez.
 * Kayıtlar panelde Admin → Site Hareketleri ekranında görünür.
 */
final class Tracking extends Module
{
    /** @param array<string,mixed> $payload */
    public function track(array $payload): mixed
    {
        return $this->client->post('/api/track', $payload);
    }

    /** @param array<string,mixed> $payload */
    public function reportError(array $payload): mixed
    {
        return $this->client->post('/api/public/client-error', $payload);
    }
}
