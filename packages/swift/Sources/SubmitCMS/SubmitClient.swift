import Foundation

#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

/// API ortamı.
public enum SubmitMode: String, Sendable {
    case production
    case test

    var baseURL: URL {
        switch self {
        case .production: URL(string: "https://live.submitcms.com")!
        case .test: URL(string: "https://dev.submitcms.com")!
        }
    }
}

public struct SubmitConfig: Sendable {
    /// `baseURL` verilirse yok sayılır.
    public var mode: SubmitMode
    /// Site token'ı — `SubmitToken` başlığıyla gönderilir.
    public var token: String
    public var locale: String?
    public var timeout: TimeInterval
    /// Yerel geliştirme ya da self-hosted kurulum için API kökü.
    public var baseURL: URL?
    /// Ağ ve 5xx hatalarında kaç kez yeniden denensin.
    public var retries: Int

    public init(
        mode: SubmitMode = .production,
        token: String,
        locale: String? = nil,
        timeout: TimeInterval = 30,
        baseURL: URL? = nil,
        retries: Int = 3
    ) {
        self.mode = mode
        self.token = token
        self.locale = locale
        self.timeout = timeout
        self.baseURL = baseURL
        self.retries = retries
    }
}

/// API'nin standart yanıt zarfı.
public struct SubmitResponse<T: Decodable>: Decodable {
    public let status: Bool?
    public let message: String?
    public let data: T?
    public let meta: PageMeta?
}

public struct PageMeta: Decodable, Sendable {
    public let currentPage: Int?
    public let lastPage: Int?
    public let perPage: Int?
    public let total: Int?

    enum CodingKeys: String, CodingKey {
        case currentPage = "current_page"
        case lastPage = "last_page"
        case perPage = "per_page"
        case total
    }
}

public enum SubmitError: Error, LocalizedError {
    /// Sunucu 4xx/5xx döndü. `code` backend'in makine-okunur kodudur
    /// (`PANEL_RETIRED`, `MODULE_DISABLED`, `ENV_REQUIRED` gibi) — mesaj
    /// değişebilir, kod değişmez; dallanırken kodu kullanın.
    case api(status: Int, code: String?, message: String)
    case unauthorized(message: String)
    case validation(message: String, errors: [String: [String]])
    case rateLimited(retryAfter: Int)
    case network(underlying: Error)
    case decoding(underlying: Error)

    public var errorDescription: String? {
        switch self {
        case .api(let status, let code, let message): "[\(status)\(code.map { " \($0)" } ?? "")] \(message)"
        case .unauthorized(let message): message
        case .validation(let message, _): message
        case .rateLimited(let retryAfter): "İstek sınırı aşıldı, \(retryAfter) sn sonra tekrar deneyin."
        case .network(let error): "Sunucuya ulaşılamadı: \(error.localizedDescription)"
        case .decoding(let error): "Yanıt çözümlenemedi: \(error.localizedDescription)"
        }
    }
}

/// SubmitCMS HTTP istemcisi.
///
/// Ağ ve 5xx hatalarında üstel bekleyerek yeniden dener. 429'da sunucunun
/// `Retry-After` süresine saygı duyar — üstel geri çekilme uygulamaz, çünkü
/// pencere sunucunun bildiği bir şeydir.
public actor SubmitClient {
    public static let envHeader = "SubmitToken"
    public static let envOverrideHeader = "EnvToken"

    private let config: SubmitConfig
    private let session: URLSession
    private let decoder: JSONDecoder

    private var headers: [String: String]
    private var authToken: String?

    public nonisolated let baseURL: URL

    public init(config: SubmitConfig, session: URLSession = .shared) {
        self.config = config
        self.session = session
        self.baseURL = config.baseURL ?? config.mode.baseURL
        self.decoder = JSONDecoder()

        var headers = [
            "Accept": "application/json",
            Self.envHeader: config.token,
        ]
        if let locale = config.locale { headers["Locale"] = locale }
        self.headers = headers
    }

    /// Oturum JWT'si — `auth.login` bunu kendisi yazar.
    public func setAuthToken(_ token: String?) {
        authToken = token
    }

    public func currentAuthToken() -> String? { authToken }

    /// Aktif siteyi değiştirir (`EnvToken`).
    ///
    /// Backend site kimliğini `?env=` → `token` → `EnvToken` → `SubmitToken`
    /// sırasıyla çözer, yani bu çağrı yapılandırmadaki token'ı ezer.
    public func setEnvironment(_ token: String?) {
        if let token {
            headers[Self.envOverrideHeader] = token
        } else {
            headers.removeValue(forKey: Self.envOverrideHeader)
        }
    }

    public func setLocale(_ locale: String) {
        headers["Locale"] = locale
    }

    /// Misafir sepeti kimliği.
    public func setGuestId(_ guestId: String?) {
        if let guestId {
            headers["X-Guest-Id"] = guestId
        } else {
            headers.removeValue(forKey: "X-Guest-Id")
        }
    }

    // MARK: - Fiiller

    public func get<T: Decodable>(_ path: String, query: [String: Any] = [:], as _: T.Type = JSONValue.self)
        async throws -> SubmitResponse<T>
    {
        try await send(path, method: "GET", query: query, body: nil)
    }

    public func post<T: Decodable>(_ path: String, body: [String: Any] = [:], as _: T.Type = JSONValue.self)
        async throws -> SubmitResponse<T>
    {
        try await send(path, method: "POST", query: [:], body: body)
    }

    public func put<T: Decodable>(_ path: String, body: [String: Any] = [:], as _: T.Type = JSONValue.self)
        async throws -> SubmitResponse<T>
    {
        try await send(path, method: "PUT", query: [:], body: body)
    }

    public func delete<T: Decodable>(_ path: String, as _: T.Type = JSONValue.self) async throws
        -> SubmitResponse<T>
    {
        try await send(path, method: "DELETE", query: [:], body: nil)
    }

    /// JSON zarfına sarılmayan uçlar için ham gövde (`llms.txt` gibi).
    public func raw(_ path: String, query: [String: Any] = [:]) async throws -> String {
        let (data, _) = try await perform(request(path, method: "GET", query: query, body: nil))
        return String(decoding: data, as: UTF8.self)
    }

    /// Çok parçalı dosya yükleme.
    public func upload<T: Decodable>(
        _ path: String,
        files: [(name: String, filename: String, mimeType: String, data: Data)],
        fields: [String: String] = [:],
        as _: T.Type = JSONValue.self
    ) async throws -> SubmitResponse<T> {
        let boundary = "submitcms-\(UUID().uuidString)"
        var body = Data()

        func append(_ string: String) { body.append(Data(string.utf8)) }

        for (key, value) in fields {
            append("--\(boundary)\r\nContent-Disposition: form-data; name=\"\(key)\"\r\n\r\n\(value)\r\n")
        }
        for file in files {
            append(
                "--\(boundary)\r\nContent-Disposition: form-data; name=\"\(file.name)\"; "
                    + "filename=\"\(file.filename)\"\r\nContent-Type: \(file.mimeType)\r\n\r\n")
            body.append(file.data)
            append("\r\n")
        }
        append("--\(boundary)--\r\n")

        var req = try request(path, method: "POST", query: [:], body: nil)
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        req.httpBody = body

        let (data, _) = try await perform(req)
        return try decode(data)
    }

    // MARK: - İç işleyiş

    private func send<T: Decodable>(
        _ path: String, method: String, query: [String: Any], body: [String: Any]?
    ) async throws -> SubmitResponse<T> {
        let (data, _) = try await perform(try request(path, method: method, query: query, body: body))
        return try decode(data)
    }

    private func decode<T: Decodable>(_ data: Data) throws -> SubmitResponse<T> {
        do {
            return try decoder.decode(SubmitResponse<T>.self, from: data)
        } catch {
            throw SubmitError.decoding(underlying: error)
        }
    }

    private func request(_ path: String, method: String, query: [String: Any], body: [String: Any]?)
        throws -> URLRequest
    {
        var components = URLComponents(
            url: baseURL.appendingPathComponent(path.hasPrefix("/") ? String(path.dropFirst()) : path),
            resolvingAgainstBaseURL: false
        )!

        let items = Self.flatten(query)
        if !items.isEmpty {
            components.queryItems = items.map { URLQueryItem(name: $0.key, value: $0.value) }
        }

        var req = URLRequest(url: components.url!, timeoutInterval: config.timeout)
        req.httpMethod = method

        for (key, value) in headers { req.setValue(value, forHTTPHeaderField: key) }
        if let authToken { req.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization") }

        if let body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        return req
    }

    private func perform(_ req: URLRequest) async throws -> (Data, HTTPURLResponse) {
        var attempt = 0
        var rateLimitAttempts = 0

        while true {
            let data: Data
            let response: URLResponse

            do {
                (data, response) = try await session.data(for: req)
            } catch {
                if attempt < config.retries {
                    attempt += 1
                    try await Task.sleep(nanoseconds: Self.backoff(attempt))
                    continue
                }
                throw SubmitError.network(underlying: error)
            }

            guard let http = response as? HTTPURLResponse else {
                throw SubmitError.network(underlying: URLError(.badServerResponse))
            }

            // 429: sunucunun verdiği süre beklenir, tahmin yürütülmez.
            if http.statusCode == 429, rateLimitAttempts < 3 {
                rateLimitAttempts += 1
                let wait = Int(http.value(forHTTPHeaderField: "Retry-After") ?? "1") ?? 1
                try await Task.sleep(nanoseconds: UInt64(wait) * 1_000_000_000)
                continue
            }

            if [408, 500, 502, 503, 504].contains(http.statusCode), attempt < config.retries {
                attempt += 1
                try await Task.sleep(nanoseconds: Self.backoff(attempt))
                continue
            }

            if http.statusCode >= 400 { throw Self.error(status: http.statusCode, data: data) }

            return (data, http)
        }
    }

    private static func backoff(_ attempt: Int) -> UInt64 {
        UInt64(min(10_000, 1000 * (1 << (attempt - 1)))) * 1_000_000
    }

    private static func error(status: Int, data: Data) -> SubmitError {
        let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
        let errorBag = json["error"] as? [String: Any] ?? [:]
        let message = (errorBag["message"] as? String) ?? (json["message"] as? String) ?? "Bilinmeyen hata"
        let code = errorBag["code"] as? String

        switch status {
        case 401, 403: return .unauthorized(message: message)
        case 422: return .validation(message: message, errors: json["errors"] as? [String: [String]] ?? [:])
        case 429: return .rateLimited(retryAfter: 1)
        default: return .api(status: status, code: code, message: message)
        }
    }

    /// İç içe sözlükleri Laravel'in beklediği `filter[alan][işleç]=değer` biçimine açar.
    static func flatten(_ value: [String: Any], prefix: String = "") -> [(key: String, value: String)] {
        var out: [(key: String, value: String)] = []

        for (key, raw) in value {
            let name = prefix.isEmpty ? key : "\(prefix)[\(key)]"

            switch raw {
            case let nested as [String: Any]:
                out += flatten(nested, prefix: name)
            case let flag as Bool:
                out.append((name, flag ? "1" : "0"))
            case is NSNull:
                continue
            default:
                out.append((name, String(describing: raw)))
            }
        }

        return out
    }
}
