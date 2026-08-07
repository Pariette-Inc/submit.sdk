<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/**
 * Sipariş yönetimi (satıcı tarafı).
 *
 * `orders` modülü açık olmalı — kapalıysa 403. Oturum ve site üyeliği ister.
 */
final class Orders extends Module
{
    /** @param array<string,mixed> $params */
    public function list(array $params = []): mixed
    {
        return $this->client->get('/api/commerce/orders', $params);
    }

    public function get(int $id): mixed
    {
        return $this->client->get('/api/commerce/orders/' . $id);
    }

    /** @param array<string,mixed> $payload */
    public function update(int $id, array $payload): mixed
    {
        return $this->client->put('/api/commerce/orders/' . $id, $payload);
    }

    /** Durum geçişi. Geçersiz geçişler 422 döner. */
    public function updateStatus(int $id, string $status, array $payload = []): mixed
    {
        return $this->client->put('/api/commerce/orders/' . $id . '/status', compact('status') + $payload);
    }

    /** @param array<string,mixed> $payload */
    public function cancel(int $id, array $payload = []): mixed
    {
        return $this->client->post('/api/commerce/orders/' . $id . '/cancel', $payload);
    }

    /** Satış raporu — ciro, adet, dönem kırılımı. @param array<string,mixed> $params */
    public function report(array $params = []): mixed
    {
        return $this->client->get('/api/commerce/orders/report', $params);
    }

    /** @param array<string,mixed> $payload */
    public function createInvoice(int $orderId, array $payload = []): mixed
    {
        return $this->client->post('/api/commerce/orders/' . $orderId . '/invoice', $payload);
    }

    public function invoice(int $orderId): mixed
    {
        return $this->client->get('/api/commerce/orders/' . $orderId . '/invoice');
    }

    public function mailSettings(): mixed
    {
        return $this->client->get('/api/commerce/orders/mail-settings');
    }

    /** @param array<string,mixed> $payload */
    public function updateMailSettings(array $payload): mixed
    {
        return $this->client->put('/api/commerce/orders/mail-settings', $payload);
    }
}
