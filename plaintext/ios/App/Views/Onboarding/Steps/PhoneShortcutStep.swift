import PlaintextKit
import SwiftUI

struct PhoneShortcutStep: View {
  // MARK: State
  @Environment(AppModel.self) private var model

  // MARK: Body
  var body: some View {
    StepScaffold(title: "Add the Phone shortcut") {
      NumberedSteps(
        steps: OnboardingGuide.instructions(
          for: .phoneShortcut,
          systemMajorVersion: model.systemMajorVersion,
          appearance: model.configuration.theme.appearance
        )
      )
    } actions: {
      ShortcutInstallButton(shortcut: .phone, title: "Add Phone Shortcut")
      Button("I added it") {
        model.updateState { $0.phoneShortcutInstalled = true }
        model.complete(.phoneShortcut)
      }
      .buttonStyle(SecondaryButtonStyle())
    }
  }
}
