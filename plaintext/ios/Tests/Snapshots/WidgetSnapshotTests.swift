import Foundation
import SwiftUI
import Testing
import UIKit

/// Renders every widget variant to PNG for review. Set `SNAPSHOT_DIR` (CI passes `TEST_RUNNER_SNAPSHOT_DIR`)
/// to also write the images to disk; they're always attached to the test results.
@MainActor
struct WidgetSnapshotTests {
  @Test(arguments: WidgetSnapshot.all)
  func render(_ snapshot: WidgetSnapshot) throws {
    // Arrange
    let renderer = ImageRenderer(content: WidgetSnapshotView(snapshot: snapshot))
    renderer.scale = 2

    // Act
    let png = try #require(renderer.uiImage?.pngData())
    try save(png, named: snapshot.name)

    // Assert
    #expect(!png.isEmpty)
  }

  private func save(_ png: Data, named name: String) throws {
    Attachment.record(png, named: "\(name).png")
    guard let path = ProcessInfo.processInfo.environment["SNAPSHOT_DIR"] else { return }
    let directory = URL(fileURLWithPath: path, isDirectory: true)
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    try png.write(to: directory.appendingPathComponent("\(name).png"))
  }
}
