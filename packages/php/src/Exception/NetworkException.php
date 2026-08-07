<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Exception;

use RuntimeException;

/** Sunucuya hiç ulaşılamadı — DNS, bağlantı ya da zaman aşımı. */
class NetworkException extends RuntimeException
{
}
