<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/**
 * İçerik tipleri — sitenin veri şeması.
 *
 * Önce tip tanımlarsınız, sonra `$sdk->records` ile o tipte kayıt açarsınız.
 * Şema değişiklikleri sürümlenir; kayıtlar yazıldıkları sürümü taşır.
 *
 * ```php
 * $sdk->contentTypes->create([
 *     'code' => 'blog', 'label' => 'Blog Yazısı', 'kind' => 'content',
 *     'fields' => [
 *         ['code' => 'baslik', 'label' => 'Başlık', 'type' => 'text', 'required' => true],
 *         ['code' => 'icerik', 'label' => 'İçerik', 'type' => 'richtext'],
 *     ],
 * ]);
 * ```
 */
final class ContentTypes extends Module
{
    public function list(): mixed
    {
        return $this->client->get('/api/schema/types');
    }

    public function get(string $code): mixed
    {
        return $this->client->get('/api/schema/types/' . $this->seg($code));
    }

    /** @param array<string,mixed> $payload */
    public function create(array $payload): mixed
    {
        return $this->client->post('/api/schema/types', $payload);
    }

    /**
     * Tipi günceller ve sürümü artırır. Alan silmek eski kayıtlardaki
     * değerleri düşürür.
     *
     * @param array<string,mixed> $payload
     */
    public function update(string $code, array $payload): mixed
    {
        return $this->client->put('/api/schema/types/' . $this->seg($code), $payload);
    }

    public function delete(string $code): mixed
    {
        return $this->client->delete('/api/schema/types/' . $this->seg($code));
    }

    /** Panelin kayıt formunu çizdiği tanım — kendi arayüzünüz için. */
    public function form(string $code): mixed
    {
        return $this->client->get('/api/schema/types/' . $this->seg($code) . '/form');
    }

    public function revisions(string $code): mixed
    {
        return $this->client->get('/api/schema/types/' . $this->seg($code) . '/revisions');
    }

    /** Bu tipe özel, siteye göre kişiselleştirilmiş entegrasyon örnekleri. */
    public function integration(string $code): mixed
    {
        return $this->client->get('/api/schema/types/' . $this->seg($code) . '/integration');
    }

    /** Şemayı yapay zekâ ile üretir. @param array<string,mixed> $payload */
    public function aiGenerate(string $code, array $payload): mixed
    {
        return $this->client->post('/api/schema/types/' . $this->seg($code) . '/ai/generate', $payload);
    }
}
