<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/** Kayıt kategorileri — ağacı `parent_id` kurar. */
final class Categories extends Module
{
    public function list(): mixed
    {
        return $this->client->get('/api/schema/categories');
    }

    /** @param array<string,mixed> $payload */
    public function create(array $payload): mixed
    {
        return $this->client->post('/api/schema/categories', $payload);
    }

    /** @param array<string,mixed> $payload */
    public function update(int $id, array $payload): mixed
    {
        return $this->client->put('/api/schema/categories/' . $id, $payload);
    }

    public function delete(int $id): mixed
    {
        return $this->client->delete('/api/schema/categories/' . $id);
    }
}
