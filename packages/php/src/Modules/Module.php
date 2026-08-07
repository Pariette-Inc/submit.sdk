<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

use SubmitCms\Sdk\Client;

/**
 * Tüm modüllerin ortak atası.
 *
 * Yollar `/api/...` ile tam yazılır; böylece bir satır okunduğunda
 * `spec/endpoints.json`'daki kayıtla birebir eşleşir.
 */
abstract class Module
{
    public function __construct(protected Client $client)
    {
    }

    /** URL segmentine güvenle gömülecek biçimde kaçışlar. */
    protected function seg(string|int $value): string
    {
        return rawurlencode((string) $value);
    }
}
