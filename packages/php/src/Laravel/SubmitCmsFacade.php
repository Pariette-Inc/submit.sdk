<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Laravel;

use Illuminate\Support\Facades\Facade;

/**
 * `SubmitCms` facade'i.
 *
 * ```php
 * use SubmitCms;
 *
 * $posts = SubmitCms::delivery()->records('blog');
 * ```
 *
 * @method static \SubmitCms\Sdk\Modules\Delivery     delivery()
 * @method static \SubmitCms\Sdk\Modules\Auth         auth()
 * @method static \SubmitCms\Sdk\Modules\Records      records()
 * @method static \SubmitCms\Sdk\Modules\ContentTypes contentTypes()
 * @method static \SubmitCms\Sdk\Modules\Menus        menus()
 * @method static \SubmitCms\Sdk\Modules\Cart         cart()
 * @method static \SubmitCms\Sdk\Modules\Orders       orders()
 * @method static \SubmitCms\Sdk\Modules\Platform     platform()
 *
 * @see \SubmitCms\Sdk\SubmitCms
 */
final class SubmitCmsFacade extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'submitcms';
    }
}
