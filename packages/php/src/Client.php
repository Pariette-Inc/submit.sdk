<?php

declare(strict_types=1);

namespace SubmitCms\Sdk;

use GuzzleHttp\Client as Guzzle;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Psr7\Utils;
use Psr\Http\Message\ResponseInterface;
use SubmitCms\Sdk\Exception\ApiException;
use SubmitCms\Sdk\Exception\AuthenticationException;
use SubmitCms\Sdk\Exception\NetworkException;
use SubmitCms\Sdk\Exception\RateLimitException;
use SubmitCms\Sdk\Exception\ValidationException;

/**
 * SubmitCMS HTTP istemcisi.
 *
 * Tüm modüller bu sınıf üzerinden API'ye erişir. Ağ ve 5xx hatalarında
 * üstel bekleyerek yeniden dener; 429'da sunucunun söylediği `Retry-After`
 * süresine saygı duyar (üstel geri çekilme uygulamaz — sunucu ne dediyse o).
 */
final class Client
{
    public const ENV_HEADER = 'SubmitToken';
    public const ENV_OVERRIDE_HEADER = 'EnvToken';

    public const URLS = [
        'production' => 'https://live.submitcms.com',
        'test' => 'https://dev.submitcms.com',
    ];

    /** 429 için üst deneme sınırı — Retry-After beklenerek en çok bu kadar denenir. */
    private const MAX_RATE_LIMIT_RETRIES = 3;

    private Guzzle $http;
    private string $baseUrl;
    private ?string $authToken = null;

    /** @var array<string,string> */
    private array $headers;

    /**
     * @param  array{
     *     mode?: 'production'|'test',
     *     token: string,
     *     locale?: string,
     *     timeout?: int,
     *     baseUrl?: string,
     *     retries?: int,
     *     retryBaseDelayMs?: int,
     * }  $config
     */
    public function __construct(private array $config)
    {
        $this->baseUrl = rtrim($config['baseUrl'] ?? self::URLS[$config['mode'] ?? 'production'], '/');

        $this->headers = array_filter([
            'Accept' => 'application/json',
            self::ENV_HEADER => $config['token'],
            'Locale' => $config['locale'] ?? null,
        ]);

        $this->http = new Guzzle([
            'base_uri' => $this->baseUrl . '/',
            'timeout' => $config['timeout'] ?? 30,
            'http_errors' => false,
        ]);
    }

    public function baseUrl(): string
    {
        return $this->baseUrl;
    }

    /** Oturum JWT'si — `auth->login()` bunu kendisi yazar. */
    public function setAuthToken(?string $token): void
    {
        $this->authToken = $token;
    }

    public function authToken(): ?string
    {
        return $this->authToken;
    }

    /**
     * Aktif siteyi değiştirir (`EnvToken`).
     *
     * Backend site kimliğini şu sırayla çözer: `?env=` → `token` → `EnvToken`
     * → `SubmitToken`. Yani bu çağrı yapılandırmadaki token'ı ezer; çok siteli
     * panellerde kullanılır. `null` verilirse yapılandırmaya dönülür.
     */
    public function setEnvironment(?string $token): void
    {
        if ($token === null) {
            unset($this->headers[self::ENV_OVERRIDE_HEADER]);

            return;
        }

        $this->headers[self::ENV_OVERRIDE_HEADER] = $token;
    }

    public function setLocale(string $locale): void
    {
        $this->headers['Locale'] = $locale;
    }

    /** Misafir sepeti kimliği. */
    public function setGuestId(?string $guestId): void
    {
        if ($guestId === null) {
            unset($this->headers['X-Guest-Id']);

            return;
        }

        $this->headers['X-Guest-Id'] = $guestId;
    }

    /** @param array<string,mixed> $query */
    public function get(string $path, array $query = []): mixed
    {
        return $this->request('GET', $path, ['query' => $this->flattenQuery($query)]);
    }

    /** @param array<string,mixed> $body */
    public function post(string $path, array $body = []): mixed
    {
        return $this->request('POST', $path, ['json' => $body]);
    }

    /** @param array<string,mixed> $body */
    public function put(string $path, array $body = []): mixed
    {
        return $this->request('PUT', $path, ['json' => $body]);
    }

    /** @param array<string,mixed> $body */
    public function patch(string $path, array $body = []): mixed
    {
        return $this->request('PATCH', $path, ['json' => $body]);
    }

    public function delete(string $path): mixed
    {
        return $this->request('DELETE', $path);
    }

    /**
     * Dosya yükler (`multipart/form-data`).
     *
     * @param  array<string, string|resource|array{0:string,1:resource|string}>  $files
     * @param  array<string, scalar>  $fields
     */
    public function upload(string $path, array $files, array $fields = []): mixed
    {
        $multipart = [];

        foreach ($fields as $name => $value) {
            $multipart[] = ['name' => (string) $name, 'contents' => (string) $value];
        }

        foreach ($files as $name => $file) {
            [$filename, $contents] = is_array($file) ? $file : [basename((string) $file), $file];
            $multipart[] = [
                'name' => (string) $name,
                'filename' => $filename,
                'contents' => is_resource($contents) ? $contents : Utils::tryFopen((string) $contents, 'r'),
            ];
        }

        return $this->request('POST', $path, ['multipart' => $multipart]);
    }

    /**
     * Ham yanıt gövdesi — JSON zarfına sarılmayan uçlar için (`llms.txt` gibi).
     */
    public function raw(string $path): string
    {
        $response = $this->send('GET', $path, []);

        return (string) $response->getBody();
    }

    /** @param array<string,mixed> $options */
    private function request(string $method, string $path, array $options = []): mixed
    {
        $response = $this->send($method, $path, $options);
        $body = (string) $response->getBody();
        $decoded = json_decode($body, true);

        return $decoded ?? $body;
    }

    /** @param array<string,mixed> $options */
    private function send(string $method, string $path, array $options): ResponseInterface
    {
        $headers = $this->headers;

        if ($this->authToken !== null) {
            $headers['Authorization'] = 'Bearer ' . $this->authToken;
        }

        $options['headers'] = $headers;

        $maxRetries = $this->config['retries'] ?? 3;
        $baseDelay = $this->config['retryBaseDelayMs'] ?? 1000;
        $rateLimitAttempts = 0;
        $attempt = 0;

        while (true) {
            try {
                $response = $this->http->request($method, ltrim($path, '/'), $options);
            } catch (ConnectException|RequestException $e) {
                if ($attempt++ < $maxRetries) {
                    $this->sleepMs(min(10_000, $baseDelay * (2 ** ($attempt - 1))));

                    continue;
                }

                throw new NetworkException('Sunucuya ulaşılamadı: ' . $e->getMessage(), previous: $e);
            }

            $status = $response->getStatusCode();

            // 429: sunucunun verdiği süreyi bekle. Üstel geri çekilme UYGULANMAZ —
            // rate limit penceresi sunucunun bildiği bir şey, tahmin edilmez.
            if ($status === 429 && $rateLimitAttempts++ < self::MAX_RATE_LIMIT_RETRIES) {
                $this->sleepMs(((int) ($response->getHeaderLine('Retry-After') ?: 1)) * 1000);

                continue;
            }

            if (in_array($status, [408, 500, 502, 503, 504], true) && $attempt++ < $maxRetries) {
                $this->sleepMs(min(10_000, $baseDelay * (2 ** ($attempt - 1))));

                continue;
            }

            if ($status >= 400) {
                $this->throwFor($status, $response);
            }

            return $response;
        }
    }

    private function throwFor(int $status, ResponseInterface $response): never
    {
        $payload = json_decode((string) $response->getBody(), true) ?: [];
        $error = $payload['error'] ?? [];
        $message = $error['message'] ?? $payload['message'] ?? $response->getReasonPhrase();
        $code = is_array($error) ? ($error['code'] ?? null) : null;

        throw match (true) {
            $status === 401, $status === 403 => new AuthenticationException($message, $status, $code, $payload),
            $status === 422 => new ValidationException($message, $status, $code, $payload),
            $status === 429 => new RateLimitException($message, $status, $code, $payload),
            default => new ApiException($message, $status, $code, $payload),
        };
    }

    /**
     * İç içe dizileri Laravel'in beklediği `filter[alan][işleç]=değer` biçimine açar.
     *
     * @param  array<string,mixed>  $query
     * @return array<string,mixed>
     */
    private function flattenQuery(array $query, string $prefix = ''): array
    {
        $out = [];

        foreach ($query as $key => $value) {
            $name = $prefix === '' ? (string) $key : $prefix . '[' . $key . ']';

            if (is_array($value)) {
                $out += $this->flattenQuery($value, $name);

                continue;
            }

            if ($value === null) {
                continue;
            }

            $out[$name] = is_bool($value) ? ($value ? '1' : '0') : $value;
        }

        return $out;
    }

    private function sleepMs(int $ms): void
    {
        usleep($ms * 1000);
    }
}
