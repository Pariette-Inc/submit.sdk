<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Site Token'ı
    |--------------------------------------------------------------------------
    |
    | `SubmitToken` başlığıyla gönderilir ve hangi siteye bağlanacağınızı
    | belirler. Panelde Konsol → Entegrasyon sekmesinde görünür.
    |
    */
    'token' => env('SUBMITCMS_TOKEN'),

    /*
    |--------------------------------------------------------------------------
    | Ortam
    |--------------------------------------------------------------------------
    |
    | `production` → https://live.submitcms.com
    | `test`       → https://dev.submitcms.com
    |
    | Yerel geliştirmede `base_url` verirseniz bu ayar yok sayılır.
    |
    */
    'mode' => env('SUBMITCMS_MODE', 'production'),

    'base_url' => env('SUBMITCMS_BASE_URL'),

    'locale' => env('SUBMITCMS_LOCALE', 'tr'),

    'timeout' => env('SUBMITCMS_TIMEOUT', 30),

    /*
    | Ağ ve 5xx hatalarında üstel bekleyerek kaç kez yeniden denensin.
    | 429 bundan bağımsızdır: sunucunun `Retry-After` süresi beklenir.
    */
    'retries' => env('SUBMITCMS_RETRIES', 3),
];
