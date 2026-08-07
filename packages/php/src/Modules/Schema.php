<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/** Şema sistemine dair yardımcı uçlar. */
final class Schema extends Module
{
    /** Desteklenen alan tipleri ve ayar şemaları. */
    public function fieldTypes(): mixed
    {
        return $this->client->get('/api/schema/field-types');
    }

    /** Hazır şema şablonları — tek adımda tip kurmak için. */
    public function presets(): mixed
    {
        return $this->client->get('/api/schema/presets');
    }

    /** Sitede hangi modüller açık. */
    public function modules(): mixed
    {
        return $this->client->get('/api/schema/modules');
    }

    /** Site haritası özeti: yayımlanmış içerik sayıları ve sitemap adresi. */
    public function sitemap(): mixed
    {
        return $this->client->get('/api/schema/sitemap');
    }
}
