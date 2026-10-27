// swift-tools-version: 6.0
import PackageDescription

let package = Package(
  name: "PlaintextKit",
  defaultLocalization: "en",
  platforms: [.iOS(.v18), .macOS(.v15)],
  products: [
    .library(name: "PlaintextKit", targets: ["PlaintextKit"])
  ],
  targets: [
    .target(
      name: "PlaintextKit",
      resources: [.process("Resources")]
    ),
    .testTarget(
      name: "PlaintextKitTests",
      dependencies: ["PlaintextKit"]
    ),
  ]
)
