import Foundation

/// Kimlik doğrulama, hesap, 2FA ve davet işlemleri.
///
/// Başarılı `login`/`console` sonrası JWT istemciye otomatik yazılır.
///
/// ```swift
/// let result = try await sdk.auth.login(email: "a@b.com", password: "parola")
/// if result.data?["two_factor_required"]?.boolValue == true {
///     let token = result.data?["two_factor_token"]?.stringValue ?? ""
///     _ = try await sdk.auth.verifyTwoFactor(token: token, code: "123456")
/// }
/// ```
public struct AuthModule: Sendable {
    let client: SubmitClient

    @discardableResult
    public func login(email: String, password: String) async throws -> SubmitResponse<JSONValue> {
        let result: SubmitResponse<JSONValue> = try await client.post(
            "/api/auth/login", body: ["email": email, "password": password])
        return await capture(result)
    }

    /// Mobil uygulama girişi — web akışından ayrı tutulur.
    @discardableResult
    public func loginApp(email: String, password: String) async throws -> SubmitResponse<JSONValue> {
        let result: SubmitResponse<JSONValue> = try await client.post(
            "/api/auth/login-app", body: ["email": email, "password": password])
        return await capture(result)
    }

    /// Panel (Console) girişi.
    @discardableResult
    public func console(email: String, password: String) async throws -> SubmitResponse<JSONValue> {
        let result: SubmitResponse<JSONValue> = try await client.post(
            "/api/auth/console", body: ["email": email, "password": password])
        return await capture(result)
    }

    /// Yeni hesap. Hesabın doğrudan aktif olup olmayacağına site karar verir
    /// (`environments.auto_activate`); istemci bunu değiştiremez.
    public func register(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/auth/register", body: payload)
    }

    public func registerAndCreateEnvironment(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/auth/registerAndCreateEnvironment", body: payload)
    }

    @discardableResult
    public func logout() async throws -> SubmitResponse<JSONValue> {
        let result: SubmitResponse<JSONValue> = try await client.post("/api/auth/logout")
        await client.setAuthToken(nil)
        return result
    }

    public func me() async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/auth/me")
    }

    @discardableResult
    public func refresh() async throws -> SubmitResponse<JSONValue> {
        let result: SubmitResponse<JSONValue> = try await client.get("/api/auth/refresh")
        return await capture(result)
    }

    /// Kullanıcının erişebildiği siteler — site seçici bunu kullanır.
    public func myEnvironments() async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/my-environments")
    }

    public func forgotPassword(email: String) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/auth/forgot-password", body: ["email": email])
    }

    public func resendForgotPasswordMail(email: String) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/auth/resend-forgot-password-mail", body: ["email": email])
    }

    public func checkResetToken(_ token: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/auth/check-reset-token", query: ["token": token])
    }

    public func resetPassword(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/auth/reset-password", body: payload)
    }

    public func updatePassword(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/auth/password/update", body: payload)
    }

    public func updateProfile(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/auth/profile/update", body: payload)
    }

    public func updateEmail(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/auth/email/update", body: payload)
    }

    public func updateAuthMethod(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/auth/auth-method/update", body: payload)
    }

    public func activateAccount(token: String) async throws -> SubmitResponse<JSONValue> {
        try await client.put("/api/auth/account-activation/\(esc(token))")
    }

    public func invitation(token: String) async throws -> SubmitResponse<JSONValue> {
        try await client.get("/api/auth/invitation/\(esc(token))")
    }

    public func completeInvitation(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/auth/complete-invitation", body: payload)
    }

    /// Google akışı tarayıcı yönlendirmesiyle yürür — bu adresi `SFSafariViewController`
    /// ya da `ASWebAuthenticationSession` ile açın.
    public var googleRedirectURL: URL {
        client.baseURL.appendingPathComponent("api/auth/google/redirect")
    }

    public func setupTwoFactor() async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/auth/2fa/setup")
    }

    public func confirmTwoFactor(code: String) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/auth/2fa/confirm", body: ["code": code])
    }

    /// Girişteki 2FA adımını tamamlar; başarılıysa JWT yazılır.
    @discardableResult
    public func verifyTwoFactor(token: String, code: String) async throws -> SubmitResponse<JSONValue> {
        let result: SubmitResponse<JSONValue> = try await client.post(
            "/api/auth/2fa/verify", body: ["token": token, "code": code])
        return await capture(result)
    }

    public func disableTwoFactor(password: String) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/auth/2fa/disable", body: ["password": password])
    }

    public func registerDevice(_ payload: [String: Any]) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/auth/device/register", body: payload)
    }

    public func removeDevice(token: String) async throws -> SubmitResponse<JSONValue> {
        try await client.post("/api/auth/device/remove", body: ["token": token])
    }

    /// Yanıtta token varsa istemciye yazar.
    ///
    /// Sonucu parametre olarak alır, çağrıyı sarmalamaz: `@autoclosure` ile
    /// sarmak actor izolasyonunu kaybettiriyor (istek closure içinde actor
    /// dışından çağrılmış sayılıyor).
    private func capture(_ result: SubmitResponse<JSONValue>) async -> SubmitResponse<JSONValue> {
        if let token = result.data?["token"]?.stringValue {
            await client.setAuthToken(token)
        }
        return result
    }
}

/// URL segmentine güvenle gömülecek biçimde kaçışlar.
func esc(_ value: String) -> String {
    value.addingPercentEncoding(withAllowedCharacters: .alphanumerics.union(.init(charactersIn: "-._~"))) ?? value
}

func esc(_ value: Int) -> String { String(value) }
