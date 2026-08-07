<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Laravel;

use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Support\ServiceProvider;
use SubmitCms\Sdk\SubmitCms;

/**
 * Laravel entegrasyonu. Paket keşfi (package discovery) ile otomatik yüklenir.
 *
 * ```bash
 * php artisan vendor:publish --tag=submitcms-config
 * ```
 *
 * `.env`:
 * ```
 * SUBMITCMS_TOKEN=site_token_buraya
 * SUBMITCMS_MODE=production
 * SUBMITCMS_LOCALE=tr
 * ```
 */
final class SubmitCmsServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../../config/submitcms.php', 'submitcms');

        $this->app->singleton(SubmitCms::class, static function ($app): SubmitCms {
            /** @var array<string,mixed> $config */
            $config = $app['config']->get('submitcms');

            return new SubmitCms([
                'mode' => $config['mode'] ?? 'production',
                'token' => (string) ($config['token'] ?? ''),
                'locale' => $config['locale'] ?? null,
                'timeout' => (int) ($config['timeout'] ?? 30),
                'baseUrl' => $config['base_url'] ?? null,
                'retries' => (int) ($config['retries'] ?? 3),
            ]);
        });

        $this->app->alias(SubmitCms::class, 'submitcms');
    }

    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/../../config/submitcms.php' => $this->app->configPath('submitcms.php'),
            ], 'submitcms-config');
        }
    }

    /** @return list<string> */
    public function provides(): array
    {
        return [SubmitCms::class, 'submitcms'];
    }
}
