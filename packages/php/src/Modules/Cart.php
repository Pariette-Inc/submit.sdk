<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/**
 * Ziyaretçi sepeti — mağaza önyüzü.
 *
 * Oturum gerekmez; misafir sepeti `X-Guest-Id` ile taşınır
 * (`$sdk->setGuestId(...)`). `ecommerce` modülü kapalıysa uçlar 403 döner.
 */
final class Cart extends Module
{
    public function get(): mixed
    {
        return $this->client->get('/api/shop/cart');
    }

    /** @param array<string,mixed> $payload */
    public function add(array $payload): mixed
    {
        return $this->client->post('/api/shop/cart', $payload);
    }

    public function updateItem(int $itemId, int $quantity): mixed
    {
        return $this->client->put('/api/shop/cart/items/' . $itemId, compact('quantity'));
    }

    public function removeItem(int $itemId): mixed
    {
        return $this->client->delete('/api/shop/cart/items/' . $itemId);
    }

    public function clear(): mixed
    {
        return $this->client->delete('/api/shop/cart');
    }

    /** Sepeti siparişe çevirir; ödeme yönlendirmesi yanıtta döner. */
    public function checkout(array $payload): mixed
    {
        return $this->client->post('/api/shop/checkout', $payload);
    }
}
