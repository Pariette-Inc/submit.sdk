<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/**
 * Kimlik doğrulama, hesap, 2FA ve davet işlemleri.
 *
 * Başarılı `login()`/`console()` sonrası JWT istemciye otomatik yazılır.
 *
 * ```php
 * $result = $sdk->auth->login('a@b.com', 'parola');
 * if ($result['data']['two_factor_required'] ?? false) {
 *     $sdk->auth->verifyTwoFactor($result['data']['two_factor_token'], '123456');
 * }
 * ```
 */
final class Auth extends Module
{
    /** @param array<string,mixed> $extra */
    public function login(string $email, string $password, array $extra = []): mixed
    {
        return $this->capture($this->client->post('/api/auth/login', compact('email', 'password') + $extra));
    }

    /** Mobil uygulama girişi. */
    public function loginApp(string $email, string $password): mixed
    {
        return $this->capture($this->client->post('/api/auth/login-app', compact('email', 'password')));
    }

    /** Panel (Console) girişi — site sahibi/ekip üyesi. */
    public function console(string $email, string $password): mixed
    {
        return $this->capture($this->client->post('/api/auth/console', compact('email', 'password')));
    }

    /**
     * Yeni hesap.
     *
     * Hesabın doğrudan aktif olup olmayacağına site karar verir
     * (`environments.auto_activate`); istemci bunu değiştiremez.
     *
     * @param array<string,mixed> $payload
     */
    public function register(array $payload): mixed
    {
        return $this->client->post('/api/auth/register', $payload);
    }

    /** @param array<string,mixed> $payload */
    public function registerAndCreateEnvironment(array $payload): mixed
    {
        return $this->client->post('/api/auth/registerAndCreateEnvironment', $payload);
    }

    public function logout(): mixed
    {
        $result = $this->client->post('/api/auth/logout');
        $this->client->setAuthToken(null);

        return $result;
    }

    public function me(): mixed
    {
        return $this->client->get('/api/auth/me');
    }

    public function refresh(): mixed
    {
        return $this->capture($this->client->get('/api/auth/refresh'));
    }

    /** Kullanıcının erişebildiği siteler. */
    public function myEnvironments(): mixed
    {
        return $this->client->get('/api/my-environments');
    }

    public function forgotPassword(string $email): mixed
    {
        return $this->client->post('/api/auth/forgot-password', compact('email'));
    }

    public function resendForgotPasswordMail(string $email): mixed
    {
        return $this->client->post('/api/auth/resend-forgot-password-mail', compact('email'));
    }

    public function checkResetToken(string $token): mixed
    {
        return $this->client->get('/api/auth/check-reset-token', compact('token'));
    }

    /** @param array<string,mixed> $payload */
    public function resetPassword(array $payload): mixed
    {
        return $this->client->post('/api/auth/reset-password', $payload);
    }

    /** @param array<string,mixed> $payload */
    public function updatePassword(array $payload): mixed
    {
        return $this->client->post('/api/auth/password/update', $payload);
    }

    /** @param array<string,mixed> $payload */
    public function updateProfile(array $payload): mixed
    {
        return $this->client->post('/api/auth/profile/update', $payload);
    }

    /** @param array<string,mixed> $payload */
    public function updateEmail(array $payload): mixed
    {
        return $this->client->post('/api/auth/email/update', $payload);
    }

    /** @param array<string,mixed> $payload */
    public function updateAuthMethod(array $payload): mixed
    {
        return $this->client->post('/api/auth/auth-method/update', $payload);
    }

    public function activateAccount(string $token): mixed
    {
        return $this->client->put('/api/auth/account-activation/' . $this->seg($token));
    }

    public function invitation(string $token): mixed
    {
        return $this->client->get('/api/auth/invitation/' . $this->seg($token));
    }

    /** @param array<string,mixed> $payload */
    public function completeInvitation(array $payload): mixed
    {
        return $this->client->post('/api/auth/complete-invitation', $payload);
    }

    /** Google akışı tarayıcı yönlendirmesiyle yürür — kullanıcıyı bu adrese gönderin. */
    public function googleRedirectUrl(): string
    {
        return $this->client->baseUrl() . '/api/auth/google/redirect';
    }

    public function setupTwoFactor(): mixed
    {
        return $this->client->post('/api/auth/2fa/setup');
    }

    public function confirmTwoFactor(string $code): mixed
    {
        return $this->client->post('/api/auth/2fa/confirm', compact('code'));
    }

    /** Girişteki 2FA adımını tamamlar; başarılıysa JWT yazılır. */
    public function verifyTwoFactor(string $token, string $code): mixed
    {
        return $this->capture($this->client->post('/api/auth/2fa/verify', compact('token', 'code')));
    }

    public function disableTwoFactor(string $password): mixed
    {
        return $this->client->post('/api/auth/2fa/disable', compact('password'));
    }

    /** @param array<string,mixed> $payload */
    public function registerDevice(array $payload): mixed
    {
        return $this->client->post('/api/auth/device/register', $payload);
    }

    public function removeDevice(string $token): mixed
    {
        return $this->client->post('/api/auth/device/remove', compact('token'));
    }

    /** Yanıtta token varsa istemciye yazar. */
    private function capture(mixed $result): mixed
    {
        if (is_array($result) && isset($result['data']['token']) && is_string($result['data']['token'])) {
            $this->client->setAuthToken($result['data']['token']);
        }

        return $result;
    }
}
