<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/** Servis durumu — uptime kontrolleri için. */
final class System extends Module
{
    public function health(): mixed
    {
        return $this->client->get('/api/health');
    }
}
