// swift-tools-version: 6.0
import PackageDescription

let package = Package(
  name: "SwiftStyle",
  platforms: [.macOS(.v13)],
  products: [
    .executable(name: "swift-style", targets: ["swift-style"]),
    .library(name: "SwiftStyleRules", targets: ["SwiftStyleRules"]),
  ],
  dependencies: [
    .package(url: "https://github.com/swiftlang/swift-syntax.git", from: "602.0.0")
  ],
  targets: [
    .target(
      name: "SwiftStyleRules",
      dependencies: [
        .product(name: "SwiftOperators", package: "swift-syntax"),
        .product(name: "SwiftParser", package: "swift-syntax"),
        .product(name: "SwiftSyntax", package: "swift-syntax"),
      ]
    ),
    .executableTarget(
      name: "swift-style",
      dependencies: ["SwiftStyleRules"]
    ),
    .testTarget(
      name: "SwiftStyleRulesTests",
      dependencies: ["SwiftStyleRules"]
    ),
  ]
)
