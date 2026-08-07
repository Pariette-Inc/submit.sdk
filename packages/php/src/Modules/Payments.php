<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/** Ödemeler. Stripe/Tami webhook uçları sunucu-sunucudur, SDK'da yer almaz. */
final class Payments extends Module
{
    /** @param array<string,mixed> $params */
    public function list(array $params = []): mixed
    {
        return $this->client->get('/api/payments', $params);
    }

    public function get(int $id): mixed
    {
        return $this->client->get('/api/payments/' . $id);
    }

    /** @param array<string,mixed> $payload */
    public function create(array $payload): mixed
    {
        return $this->client->post('/api/payments', $payload);
    }

    /** Stripe PaymentIntent açar — `client_secret` ile Stripe.js'e devredin. */
    public function createStripeIntent(array $payload): mixed
    {
        return $this->client->post('/api/payments/stripe/create-intent', $payload);
    }
}
