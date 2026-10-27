import Foundation

public enum OnboardingStep: String, Codable, CaseIterable, Sendable {
  case welcome
  case pickApps
  case theme
  case wallpaper
  case addWidgets
  case hideDockAndBorders
  case hidePages
  case assistant
  case phoneShortcut
  case grayscale
  case finish

  /// Steps the user can skip without breaking the launcher.
  public var isOptional: Bool {
    self == .grayscale
  }
}

public struct OnboardingProgress: Codable, Hashable, Sendable {
  public var completed: Set<OnboardingStep> = []
  public var isFinished = false

  public init() {}

  /// Resumes exactly where the user left off after iOS sends them to Settings or Shortcuts.
  public func nextStep(in plan: [OnboardingStep]) -> OnboardingStep? {
    guard !isFinished else { return nil }
    return plan.first { !completed.contains($0) }
  }
}

public enum OnboardingPlan {
  public static func steps(configuration: Configuration, router: LaunchRouter) -> [OnboardingStep] {
    let targets = configuration.pages.flatMap(\.items).map(\.target)
    let requirements = Set(
      targets.compactMap { target -> SetupRequirement? in
        if case .needsSetup(let requirement) = router.plan(for: target) { return requirement }
        return nil
      }
    )
    return OnboardingStep.allCases.filter { step in
      switch step {
      case .assistant: requirements.contains(.assistant)
      case .phoneShortcut: requirements.contains(.phoneShortcut)
      default: true
      }
    }
  }
}

/// Manual steps for things iOS doesn't let shortcuts automate, written per OS version because Apple keeps moving them.
public enum OnboardingGuide {
  public static func usesFullPageLauncher(systemMajorVersion: Int) -> Bool {
    systemMajorVersion >= 27
  }

  public static func instructions(for step: OnboardingStep, systemMajorVersion os: Int, appearance: Theme.Appearance)
    -> [String]
  {
    let homeScreenAppearance =
      switch appearance {
      case .system: "Automatic"
      case .light: "Light"
      case .dark: "Dark"
      }
    switch step {
    case .welcome, .pickApps, .theme, .finish:
      return []
    case .wallpaper:
      return [
        "Tap Save Wallpaper. Plaintext adds two photos, one in your light color and one in your dark color.",
        "The wallpaper will not switch between them. Choose the color you want on the home screen.",
        "Open Settings → Wallpaper → Add New Wallpaper → Photos, and choose that photo.",
        "Tap Add, then set it as the home screen wallpaper.",
        "Back in Settings → Wallpaper, tap Customize under the home screen and turn Blur off.",
        os >= 26
          ? "Make sure Perspective Zoom is off in the wallpaper's ••• menu."
          : "Turn off Perspective Zoom when you set the wallpaper.",
      ]
    case .addWidgets:
      let choosePage =
        "Touch and hold the widget, tap Edit Widget, choose a page, and choose a header or leave it blank."
      if usesFullPageLauncher(systemMajorVersion: os) {
        return [
          "Touch and hold an empty spot on your home screen until the apps jiggle.",
          "Tap Edit in the top corner, then Add Widget.",
          "Search for Plaintext and choose it.",
          "Swipe to the full-page size and tap Add Widget.",
          choosePage,
          "Add the widget again for each extra page or header.",
          "Tap Done.",
        ]
      }
      return [
        "Touch and hold an empty spot on your home screen until the apps jiggle.",
        "Tap Edit in the top corner, then Add Widget.",
        "Search for Plaintext and choose a size. A larger size fits more of the page.",
        choosePage,
        "Add the widget again for each extra page or header.",
        "Tap Done.",
      ]
    case .hideDockAndBorders:
      var steps = [
        "Drag every app out of the dock. They stay in your App Library.",
        "Touch and hold the home screen, tap Edit → Customize, and choose \(homeScreenAppearance).",
      ]
      if os >= 26 {
        steps.append("Avoid Clear and Tinted. They add glass borders around widgets that iOS won't let apps remove.")
      }
      steps.append("Open Settings → Accessibility → Display & Text Size and make sure Reduce Transparency is off.")
      return steps
    case .hidePages:
      return [
        "Touch and hold the home screen, then tap the page dots above the dock.",
        "Uncheck every page except the one with Plaintext. Nothing is deleted.",
        "Tap Done.",
      ]
    case .assistant:
      return [
        "Tap Add Assistant Shortcut, then Add Shortcut in the Shortcuts app.",
        "In Shortcuts, open Automation and tap +.",
        "Choose App, pick Plaintext, select Is Opened, and choose Run Immediately.",
        "Turn off Notify When Run, tap Next, and choose the Plaintext Assistant shortcut.",
        "Come back to Plaintext. If the automation works, this step checks itself off.",
      ]
    case .phoneShortcut:
      return [
        "Apple doesn't let other apps open Phone directly, so Plaintext uses a tiny shortcut.",
        "Tap Add Phone Shortcut, then Add Shortcut in the Shortcuts app.",
      ]
    case .grayscale:
      return [
        "Tap Add Grayscale Shortcut to toggle black and white with one tap.",
        "Optional: Settings → Accessibility → Accessibility Shortcut → Color Filters lets you triple-click the side button instead.",
      ]
    }
  }
}
