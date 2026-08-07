<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/**
 * Dosya yükleme.
 *
 * ```php
 * $sdk->storage->uploadImage('/yol/gorsel.jpg');
 * $sdk->storage->uploadImages(['/a.jpg', '/b.jpg']);
 * ```
 */
final class Storage extends Module
{
    /**
     * Tek görsel yükler.
     *
     * @param  string|resource  $file  Dosya yolu ya da açık kaynak
     * @param  array<string,scalar>  $fields
     */
    public function uploadImage(mixed $file, array $fields = []): mixed
    {
        return $this->client->upload('/api/storage-image', ['image' => $file], $fields);
    }

    /**
     * Birden çok görseli tek istekte yükler.
     *
     * @param  list<string|resource>  $files
     * @param  array<string,scalar>  $fields
     */
    public function uploadImages(array $files, array $fields = []): mixed
    {
        $payload = [];
        foreach ($files as $file) {
            $payload['images[]'] = $file;
        }

        return $this->client->upload('/api/storage-images', $payload, $fields);
    }
}
