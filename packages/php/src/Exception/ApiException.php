<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Exception;

use RuntimeException;

/**
 * API 4xx/5xx döndüğünde fırlatılır.
 *
 * `$errorCode` backend'in makine-okunur kodudur (`PANEL_RETIRED`,
 * `MODULE_DISABLED`, `ENV_REQUIRED` gibi); mesaj değişebilir, kod değişmez —
 * dallanma yaparken kodu kullanın.
 */
class ApiException extends RuntimeException
{
    /** @param array<string,mixed> $payload */
    public function __construct(
        string $message,
        private int $status = 0,
        private ?string $errorCode = null,
        private array $payload = [],
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, $status, $previous);
    }

    public function status(): int
    {
        return $this->status;
    }

    public function errorCode(): ?string
    {
        return $this->errorCode;
    }

    /** @return array<string,mixed> */
    public function payload(): array
    {
        return $this->payload;
    }

    /** Alan bazlı doğrulama hataları (varsa). @return array<string,list<string>> */
    public function errors(): array
    {
        return $this->payload['errors'] ?? [];
    }
}
