<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/** Abonelik ve fatura profilleri (SaaS tarafı). */
final class Billing extends Module
{
    public function subscriptions(): mixed
    {
        return $this->client->get('/api/user/subscriptions');
    }

    /** Satın almadan önce vergi dahil tutarı hesaplatır. */
    public function calculatePricing(array $payload): mixed
    {
        return $this->client->post('/api/user/calculate-pricing', $payload);
    }

    /** @param array<string,mixed> $payload */
    public function subscribe(array $payload): mixed
    {
        return $this->client->post('/api/user/subscribe', $payload);
    }

    public function profiles(): mixed
    {
        return $this->client->get('/api/user/billing-profiles');
    }

    /** @param array<string,mixed> $payload */
    public function createProfile(array $payload): mixed
    {
        return $this->client->post('/api/user/billing-profiles', $payload);
    }

    /** @param array<string,mixed> $payload */
    public function updateProfile(int $id, array $payload): mixed
    {
        return $this->client->put('/api/user/billing-profiles/' . $id, $payload);
    }
}
