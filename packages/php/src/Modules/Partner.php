<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/**
 * Partner paneli — bayi/ajans tarafı.
 *
 * Partner kendi müşterilerini, paketlerini ve tahsilatını yönetir.
 * Partner rolündeki oturum ister.
 */
final class Partner extends Module
{
    public function dashboard(): mixed
    {
        return $this->client->get('/api/platform/partner/dashboard');
    }

    public function settings(): mixed
    {
        return $this->client->get('/api/platform/partner/settings');
    }

    /** @param array<string,mixed> $payload */
    public function updateSettings(array $payload): mixed
    {
        return $this->client->put('/api/platform/partner/settings', $payload);
    }

    public function modules(): mixed
    {
        return $this->client->get('/api/platform/partner/modules');
    }

    /** @param array<string,mixed> $params */
    public function customers(array $params = []): mixed
    {
        return $this->client->get('/api/platform/partner/customers', $params);
    }

    public function customer(int $id): mixed
    {
        return $this->client->get('/api/platform/partner/customers/' . $id);
    }

    /** Müşteriye özel fiyat tanımlar. @param array<string,mixed> $payload */
    public function setCustomerPrices(int $id, array $payload): mixed
    {
        return $this->client->post('/api/platform/partner/customers/' . $id . '/prices', $payload);
    }

    public function packages(): mixed
    {
        return $this->client->get('/api/platform/partner/packages');
    }

    /** @param array<string,mixed> $payload */
    public function createPackage(array $payload): mixed
    {
        return $this->client->post('/api/platform/partner/packages', $payload);
    }

    /** @param array<string,mixed> $payload */
    public function updatePackage(int $id, array $payload): mixed
    {
        return $this->client->put('/api/platform/partner/packages/' . $id, $payload);
    }

    public function deletePackage(int $id): mixed
    {
        return $this->client->delete('/api/platform/partner/packages/' . $id);
    }

    /** Ödeme bağlantıları — müşteriye gönderilen tek kullanımlık tahsilat linki. */
    public function checkoutLinks(): mixed
    {
        return $this->client->get('/api/platform/partner/checkout-links');
    }

    /** @param array<string,mixed> $payload */
    public function createCheckoutLink(array $payload): mixed
    {
        return $this->client->post('/api/platform/partner/checkout-links', $payload);
    }

    public function sendCheckoutLink(int $id): mixed
    {
        return $this->client->post('/api/platform/partner/checkout-links/' . $id . '/send');
    }

    public function cancelCheckoutLink(int $id): mixed
    {
        return $this->client->post('/api/platform/partner/checkout-links/' . $id . '/cancel');
    }

    public function gateways(): mixed
    {
        return $this->client->get('/api/platform/partner/gateways');
    }

    /** @param array<string,mixed> $payload */
    public function createGateway(array $payload): mixed
    {
        return $this->client->post('/api/platform/partner/gateways', $payload);
    }

    /** @param array<string,mixed> $payload */
    public function updateGateway(int $id, array $payload): mixed
    {
        return $this->client->put('/api/platform/partner/gateways/' . $id, $payload);
    }

    public function deleteGateway(int $id): mixed
    {
        return $this->client->delete('/api/platform/partner/gateways/' . $id);
    }

    /** Anahtarları test eder. */
    public function verifyGateway(int $id): mixed
    {
        return $this->client->post('/api/platform/partner/gateways/' . $id . '/verify');
    }

    public function bankTransfers(): mixed
    {
        return $this->client->get('/api/platform/partner/bank-transfers');
    }

    /** Havale bildirimini onaylar ya da reddeder. @param array<string,mixed> $payload */
    public function reviewBankTransfer(int $id, array $payload): mixed
    {
        return $this->client->post('/api/platform/partner/bank-transfers/' . $id . '/review', $payload);
    }

    public function transfers(): mixed
    {
        return $this->client->get('/api/platform/partner/transfers');
    }

    /** @param array<string,mixed> $payload */
    public function createTransfer(array $payload): mixed
    {
        return $this->client->post('/api/platform/partner/transfers', $payload);
    }

    /** @param array<string,mixed> $payload */
    public function respondTransfer(int $id, array $payload): mixed
    {
        return $this->client->post('/api/platform/partner/transfers/' . $id . '/respond', $payload);
    }

    public function receiptPdfUrl(int $id): string
    {
        return $this->client->baseUrl() . '/api/platform/partner/receipts/' . $id . '/pdf';
    }
}
