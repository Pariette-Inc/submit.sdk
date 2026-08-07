<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/**
 * Müşterinin kendi sitesini yönettiği self-servis uçlar (`platform/my`).
 *
 * Site üyeliği zorunlu — başka bir sitenin verisine erişilemez.
 */
final class Platform extends Module
{
    /** Plan, kota kullanımı ve site durumu. */
    public function overview(): mixed
    {
        return $this->client->get('/api/platform/my/overview');
    }

    /** @param array<string,mixed> $params */
    public function analytics(array $params = []): mixed
    {
        return $this->client->get('/api/platform/my/analytics', $params);
    }

    /** @param array<string,mixed> $params */
    public function payments(array $params = []): mixed
    {
        return $this->client->get('/api/platform/my/payments', $params);
    }

    public function receipts(): mixed
    {
        return $this->client->get('/api/platform/my/receipts');
    }

    /** PDF indirme adresi — ikili veri döndürülmez. */
    public function receiptPdfUrl(int $id): string
    {
        return $this->client->baseUrl() . '/api/platform/my/receipts/' . $id . '/pdf';
    }

    /** Uzatma ödemesi başlatır; yanıttaki `pay_url` ödeme ekranına götürür. */
    public function renewSubscription(string $period = 'monthly'): mixed
    {
        return $this->client->post('/api/platform/my/subscription/renew', ['period' => $period]);
    }

    /**
     * Geçilebilecek planlar: her biri için şimdi ödenecek fark ve dönem fiyatı.
     *
     * @param array<string,mixed> $params
     */
    public function subscriptionPlans(array $params = []): mixed
    {
        return $this->client->get('/api/platform/my/subscription/plans', $params);
    }

    /**
     * Plan değiştirir. Yükseltme fark tahsilatıyla hemen (`mode: payment`),
     * düşürme dönem sonunda (`mode: scheduled`) geçerli olur.
     */
    public function changePlan(int $packageId, string $period = 'monthly'): mixed
    {
        return $this->client->post('/api/platform/my/subscription/change-plan', [
            'package_id' => $packageId,
            'period' => $period,
        ]);
    }

    public function cancelPendingPlanChange(): mixed
    {
        return $this->client->delete('/api/platform/my/subscription/pending-change');
    }

    public function modules(): mixed
    {
        return $this->client->get('/api/platform/my/modules');
    }

    /** Modülü satın alır; ödeme gerekiyorsa yanıtta yönlendirme döner. */
    public function purchaseModule(string $code, array $payload = []): mixed
    {
        return $this->client->post('/api/platform/my/modules/' . $this->seg($code) . '/purchase', $payload);
    }

    public function domains(): mixed
    {
        return $this->client->get('/api/platform/my/domains');
    }

    /**
     * Özel alan adı ekler. Dönen TXT kaydını müşteri DNS'ine ekleyip
     * `verifyDomain()` çağırın; kayıt `_submit.<alan adı>` altında aranır.
     */
    public function addDomain(string $domain): mixed
    {
        return $this->client->post('/api/platform/my/domains', compact('domain'));
    }

    public function verifyDomain(int $id): mixed
    {
        return $this->client->post('/api/platform/my/domains/' . $id . '/verify');
    }

    public function removeDomain(int $id): mixed
    {
        return $this->client->delete('/api/platform/my/domains/' . $id);
    }

    public function team(): mixed
    {
        return $this->client->get('/api/platform/my/team');
    }

    /** @param array<string,mixed> $payload */
    public function inviteTeamMember(array $payload): mixed
    {
        return $this->client->post('/api/platform/my/team/invite', $payload);
    }

    public function cancelInvitation(int $id): mixed
    {
        return $this->client->delete('/api/platform/my/team/invitations/' . $id);
    }

    public function removeTeamMember(int $id): mixed
    {
        return $this->client->delete('/api/platform/my/team/members/' . $id);
    }

    /** Herkese açık paket listesi — fiyatlandırma sayfası için. */
    public function plans(): mixed
    {
        return $this->client->get('/api/platform/plans');
    }

    /**
     * Tek planın dökümü — modüller, limitler, dönem fiyatları, para birimleri.
     *
     * @param array<string,mixed> $params
     */
    public function plan(string $code, array $params = []): mixed
    {
        return $this->client->get('/api/platform/plans/' . $this->seg($code), $params);
    }

    /** Ödeme bağlantısı — oturum gerekmez, bağlantıyı alan herkes kullanır. */
    public function payLink(string $token): mixed
    {
        return $this->client->get('/api/platform/pay/' . $this->seg($token));
    }

    /** @param array<string,mixed> $payload */
    public function payByCard(string $token, array $payload): mixed
    {
        return $this->client->post('/api/platform/pay/' . $this->seg($token) . '/card', $payload);
    }

    /** @param array<string,mixed> $payload */
    public function payByBankTransfer(string $token, array $payload): mixed
    {
        return $this->client->post('/api/platform/pay/' . $this->seg($token) . '/bank-transfer', $payload);
    }

    /** Whitelabel partner açılış sayfası. */
    public function partnerSite(string $slug): mixed
    {
        return $this->client->get('/api/platform/site/' . $this->seg($slug));
    }

    /** @param array<string,mixed> $payload */
    public function buyPackage(string $slug, int $packageId, array $payload = []): mixed
    {
        return $this->client->post('/api/platform/site/' . $this->seg($slug) . '/packages/' . $packageId . '/buy', $payload);
    }
}
