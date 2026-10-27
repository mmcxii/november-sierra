import Foundation
import XCTest

/// Numbered full-screen captures, attached to the test results and, when `SCREENSHOT_DIR` is set (CI passes
/// `TEST_RUNNER_SCREENSHOT_DIR`), written there as PNGs in the order they were taken.
@MainActor
final class Screenshots {
  private let testCase: XCTestCase
  private let directory: URL?
  private var count = 0

  init(testCase: XCTestCase) {
    self.testCase = testCase
    directory = ProcessInfo.processInfo.environment["SCREENSHOT_DIR"].map { URL(fileURLWithPath: $0) }
    if let directory {
      try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    }
  }

  func capture(_ name: String) {
    count += 1
    let label = "\(count < 10 ? "0" : "")\(count)-\(name)"
    let screenshot = XCUIScreen.main.screenshot()

    let attachment = XCTAttachment(screenshot: screenshot)
    attachment.name = label
    attachment.lifetime = .keepAlways
    testCase.add(attachment)

    if let directory {
      try? screenshot.pngRepresentation.write(to: directory.appendingPathComponent("\(label).png"))
    }
  }
}
