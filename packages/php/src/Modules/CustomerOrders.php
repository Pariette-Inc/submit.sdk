<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/** Müşterinin kendi siparişleri — son kullanıcı hesabı. */
final class CustomerOrders extends Module
{
    /** @param array<string,mixed> $params */
    public function list(array $params = []): mixed
    {
        return $this->client->get('/api/my-orders', $params);
    }

    public function get(int $id): mixed
    {
        return $this->client->get('/api/my-orders/' . $id);
    }

    /** @param array<string,mixed> $payload */
    public function cancel(int $id, array $payload = []): mixed
    {
        return $this->client->post('/api/my-orders/' . $id . '/cancel', $payload);
    }

    /** Satıcıya sipariş üzerinden mesaj yazar. */
    public function message(int $id, string $message): mixed
    {
        return $this->client->post('/api/my-orders/' . $id . '/message', compact('message'));
    }
}
