<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/**
 * Eski sepet/checkout uçları (`/api/shopping/*`).
 *
 * Yeni entegrasyonlarda `$sdk->cart` kullanın. Bunlar hâlen canlı ve eski
 * mağazalar için ayakta; kupon ve kargo seçenekleri şu an yalnızca burada.
 */
final class Shopping extends Module
{
    public function cart(): mixed
    {
        return $this->client->get('/api/shopping/cart');
    }

    /** @param array<string,mixed> $payload */
    public function addToCart(array $payload): mixed
    {
        return $this->client->post('/api/shopping/cart', $payload);
    }

    /** @param array<string,mixed> $payload */
    public function updateCartItem(int $itemId, array $payload): mixed
    {
        return $this->client->put('/api/shopping/cart/' . $itemId, $payload);
    }

    public function removeCartItem(int $itemId): mixed
    {
        return $this->client->delete('/api/shopping/cart/' . $itemId);
    }

    public function clearCart(): mixed
    {
        return $this->client->delete('/api/shopping/cart/clear');
    }

    /** @param array<string,mixed> $payload */
    public function checkout(array $payload): mixed
    {
        return $this->client->post('/api/shopping/checkout', $payload);
    }

    /** Ödeme ve teslimat seçenekleri. */
    public function checkoutOptions(): mixed
    {
        return $this->client->get('/api/shopping/checkout/options');
    }

    /** Kupon uygular ve yeni toplamı döner. */
    public function applyCoupon(string $code): mixed
    {
        return $this->client->post('/api/shopping/checkout/coupon', compact('code'));
    }

    public function carriers(): mixed
    {
        return $this->client->get('/api/shopping/carriers');
    }
}
