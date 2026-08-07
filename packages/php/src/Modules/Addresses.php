<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/**
 * Kullanıcı adresleri.
 *
 * `/api/user/addresses` ve `/api/shopping/addresses` aynı işi görür;
 * SDK ilkini kullanır.
 */
final class Addresses extends Module
{
    public function list(): mixed
    {
        return $this->client->get('/api/user/addresses');
    }

    /** @param array<string,mixed> $payload */
    public function create(array $payload): mixed
    {
        return $this->client->post('/api/user/addresses', $payload);
    }

    /** @param array<string,mixed> $payload */
    public function update(int $id, array $payload): mixed
    {
        return $this->client->put('/api/user/addresses/' . $id, $payload);
    }

    public function delete(int $id): mixed
    {
        return $this->client->delete('/api/user/addresses/' . $id);
    }
}
