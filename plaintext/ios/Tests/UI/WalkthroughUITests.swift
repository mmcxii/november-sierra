import XCTest

/// Drives a fresh install through onboarding and the main screens, capturing each one. CI runs it once in light
/// and once in dark mode while recording the simulator.
final class WalkthroughUITests: XCTestCase {
  private static let stepNames = [
    "Plaintext": "welcome",
    "Match the wallpaper": "wallpaper",
    "Add the widget": "add-widgets",
    "Clear the dock": "clear-dock",
    "Hide the other pages": "hide-pages",
    "Set up the Assistant": "assistant",
    "Add the Phone shortcut": "phone-shortcut",
    "Try grayscale": "grayscale",
    "That's it.": "finish",
  ]

  /// The button that moves each onboarding step forward without leaving the app.
  private static let advanceButtons = ["Begin", "Continue", "I already set it", "Skip for now", "I added it", "Done"]

  private static let essentials = ["Phone", "Messages", "Camera", "Maps", "Music", "Notes"]

  @MainActor
  func testWalkthrough() throws {
    // Arrange
    let app = XCUIApplication()
    app.launchArguments = ["-resetForUITests"]
    let screenshots = Screenshots(testCase: self)

    // Act
    app.launch()
    try completeOnboarding(app, screenshots)
    exploreHome(app, screenshots)

    // Assert
    XCTAssertTrue(app.navigationBars["Plaintext"].waitForExistence(timeout: 5))
  }

  @MainActor
  private func completeOnboarding(_ app: XCUIApplication, _ screenshots: Screenshots) throws {
    for _ in 0..<20 {
      settle()
      if app.navigationBars["Plaintext"].exists { return }

      if app.staticTexts["Pick your essentials"].exists {
        screenshots.capture("pick-apps")
        for name in Self.essentials {
          app.buttons[name].firstMatch.tap()
        }
        screenshots.capture("pick-apps-chosen")
      } else if app.staticTexts["Make it yours"].exists {
        screenshots.capture("theme")
        let appearance = app.segmentedControls.firstMatch
        appearance.buttons["Dark"].tap()
        settle()
        screenshots.capture("theme-pinned-dark")
        appearance.buttons["Light"].tap()
        settle()
        screenshots.capture("theme-pinned-light")
        appearance.buttons["System"].tap()
      } else {
        let title = Self.stepNames.first { app.staticTexts[$0.key].exists }?.value ?? "onboarding"
        screenshots.capture(title)
      }

      let advance = Self.advanceButtons.lazy.map { app.buttons[$0].firstMatch }.first { $0.exists && $0.isHittable }
      try XCTUnwrap(advance, "No button to continue onboarding").tap()
    }
    XCTFail("Onboarding didn't finish")
  }

  @MainActor
  private func exploreHome(_ app: XCUIApplication, _ screenshots: Screenshots) {
    screenshots.capture("home")
    app.swipeUp()
    screenshots.capture("home-scrolled")

    scroll(app, to: app.buttons["Edit page"]).tap()
    settle()
    screenshots.capture("page-editor")
    app.staticTexts["Phone"].firstMatch.tap()
    settle()
    dismissSlideToTypeTip(app)
    screenshots.capture("rename")
    replaceAlertText(app, with: "calls")
    app.alerts.buttons["Save"].tap()
    settle()
    screenshots.capture("page-renamed")

    scroll(app, to: app.buttons["Add app"]).tap()
    settle()
    screenshots.capture("add-app")
    app.navigationBars["Add app"].buttons["Cancel"].tap()
    settle()
    goBack(app)
    screenshots.capture("home-renamed")

    scroll(app, to: app.buttons["Edit header"]).tap()
    settle()
    screenshots.capture("header-editor")
    app.swipeUp()
    screenshots.capture("header-editor-scrolled")
    goBack(app)

    app.navigationBars["Plaintext"].buttons["Settings"].tap()
    settle()
    screenshots.capture("settings")
    app.swipeUp()
    screenshots.capture("settings-scrolled")
    app.swipeUp()
    screenshots.capture("settings-bottom")

    let unlock = scroll(app, to: app.buttons["Unlock Plaintext Pro"])
    if unlock.isHittable {
      unlock.tap()
      settle()
      screenshots.capture("paywall")
      app.swipeUp()
      screenshots.capture("paywall-scrolled")
      app.buttons["Not now"].tap()
    }
    app.navigationBars.buttons.element(boundBy: 0).tap()
  }

  /// Replaces whatever the rename alert currently holds. The page card then shows the new label with the
  /// catalog name struck through beside it.
  @MainActor
  private func replaceAlertText(_ app: XCUIApplication, with text: String) {
    let field = app.alerts.textFields.firstMatch
    guard field.waitForExistence(timeout: 2) else { return }
    field.tap()
    if let existing = field.value as? String, !existing.isEmpty {
      field.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: existing.count))
    }
    field.typeText(text)
  }

  /// Pops the editor. The back button is the previous title when it fits, and "Back" when it doesn't.
  @MainActor
  private func goBack(_ app: XCUIApplication) {
    let bar = app.navigationBars.firstMatch
    if bar.buttons["Plaintext"].exists {
      bar.buttons["Plaintext"].tap()
    } else if bar.buttons["Back"].exists {
      bar.buttons["Back"].tap()
    } else {
      bar.buttons.element(boundBy: 0).tap()
    }
    settle()
  }

  /// The simulator's first keyboard use shows a tip whose button disappears as it is tapped, which fails a
  /// direct tap. Press its center through the app window instead.
  @MainActor
  private func dismissSlideToTypeTip(_ app: XCUIApplication) {
    let tip = app.buttons["Continue"]
    guard tip.exists else { return }
    let frame = app.frame
    guard frame.width > 0, frame.height > 0 else { return }
    let point = tip.frame
    app.coordinate(
      withNormalizedOffset: CGVector(dx: point.midX / frame.width, dy: point.midY / frame.height)
    ).tap()
    settle()
  }

  /// Lists only create rows near the screen, so swipe until the element exists and can be tapped.
  @MainActor
  private func scroll(_ app: XCUIApplication, to element: XCUIElement) -> XCUIElement {
    for _ in 0..<6 where !(element.exists && element.isHittable) {
      app.swipeUp()
    }
    return element
  }

  /// Lets transitions finish so screenshots and the recording show settled screens, and accepts any
  /// permission prompt the simulator raises.
  @MainActor
  private func settle() {
    Thread.sleep(forTimeInterval: 1)
    let alert = XCUIApplication(bundleIdentifier: "com.apple.springboard").alerts.firstMatch
    guard alert.exists else { return }
    for label in ["Allow While Using App", "Allow", "OK"] where alert.buttons[label].exists {
      alert.buttons[label].tap()
      return
    }
  }
}
