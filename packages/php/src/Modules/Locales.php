<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/**
 * Sitenin dilleri.
 *
 * Burada tanımlı olmayan bir dile kayıt yazılamaz (422) — bu, panelde hiç
 * görünmeyen "hayalet" çevirileri engeller.
 */
final class Locales extends Module
{
    public function list(): mixed
    {
        return $this->client->get('/api/schema/locales');
    }

    /** Dünya dilleri kataloğu: doğru kod (tr_TR), kısa kod, ad, yerel ad, bayrak. */
    public function catalog(): mixed
    {
        return $this->client->get('/api/schema/locales/catalog');
    }

    /**
     * Dil ekler. Kod her yazımda kabul edilir (tr, tr-TR, tr_TR, us); `label` verilmezse dilin kendi adı.
     *
     * @param array<string,mixed> $extra
     */
    public function add(string $code, array $extra = []): mixed
    {
        return $this->client->post('/api/schema/locales', compact('code') + $extra);
    }

    public function remove(string $code): mixed
    {
        return $this->client->delete('/api/schema/locales/' . $this->seg($code));
    }
}
