import XCTest

@testable import SubmitCMS

final class SubmitClientTests: XCTestCase {
    func testBaseURLFollowsMode() {
        XCTAssertEqual(SubmitMode.production.baseURL.absoluteString, "https://live.submitcms.com")
        XCTAssertEqual(SubmitMode.test.baseURL.absoluteString, "https://dev.submitcms.com")
    }

    func testExplicitBaseURLWinsOverMode() {
        let custom = URL(string: "http://localhost:8000")!
        let client = SubmitClient(config: .init(mode: .production, token: "t", baseURL: custom))
        XCTAssertEqual(client.baseURL, custom)
    }

    /// Laravel iç içe sorguyu `filter[alan][işleç]=değer` olarak bekler.
    func testNestedQueryFlattening() {
        let flat = SubmitClient.flatten(["filter": ["price": ["gte": 100]], "page": 2])
        let pairs = Dictionary(uniqueKeysWithValues: flat.map { ($0.key, $0.value) })

        XCTAssertEqual(pairs["filter[price][gte]"], "100")
        XCTAssertEqual(pairs["page"], "2")
    }

    /// Bool'lar `true`/`false` değil `1`/`0` gitmeli — PHP'nin boolean
    /// doğrulaması "true" dizesini kabul etmez.
    func testBooleansBecomeOneAndZero() {
        let flat = SubmitClient.flatten(["in_stock": true, "noindex": false])
        let pairs = Dictionary(uniqueKeysWithValues: flat.map { ($0.key, $0.value) })

        XCTAssertEqual(pairs["in_stock"], "1")
        XCTAssertEqual(pairs["noindex"], "0")
    }

    func testJSONValueSubscripts() throws {
        let data = Data(#"{"data":{"items":[{"title":"Merhaba"}]}}"#.utf8)
        let value = try JSONDecoder().decode(JSONValue.self, from: data)

        XCTAssertEqual(value["data"]?["items"]?[0]?["title"]?.stringValue, "Merhaba")
    }
}
