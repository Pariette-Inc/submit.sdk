<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/**
 * Yapay zekâ kredileri.
 *
 * Her AI çağrısı (iyileştirme, çeviri, SEO, görsel) kredi harcar; bakiye
 * yetmezse ilgili uç 402 döner.
 */
final class Ai extends Module
{
    public function credits(): mixed
    {
        return $this->client->get('/api/ai/credits');
    }

    public function packages(): mixed
    {
        return $this->client->get('/api/ai/credits/packages');
    }

    /** @param array<string,mixed> $extra */
    public function purchase(int $packageId, array $extra = []): mixed
    {
        return $this->client->post('/api/ai/credits/purchase', ['package_id' => $packageId] + $extra);
    }

    /** Harcama geçmişi. @param array<string,mixed> $params */
    public function transactions(array $params = []): mixed
    {
        return $this->client->get('/api/ai/credits/transactions', $params);
    }

    /** Kullanılabilir görsel modelleri ve kredi maliyetleri. */
    public function imageModels(): mixed
    {
        return $this->client->get('/api/schema/ai/image-models');
    }

    /** Görsel üretir ve site medyasına kaydeder. @param array<string,mixed> $payload */
    public function generateImage(array $payload): mixed
    {
        return $this->client->post('/api/schema/ai/image', $payload);
    }
}
