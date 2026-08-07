// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "SubmitCMS",
    platforms: [.iOS(.v15), .macOS(.v12), .tvOS(.v15), .watchOS(.v8)],
    products: [
        .library(name: "SubmitCMS", targets: ["SubmitCMS"])
    ],
    targets: [
        .target(name: "SubmitCMS"),
        .testTarget(name: "SubmitCMSTests", dependencies: ["SubmitCMS"]),
    ]
)
