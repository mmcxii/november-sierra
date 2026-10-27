import PlaintextKit
import SwiftUI

struct GrayscaleStep: View {
  // MARK: State
  @Environment(AppModel.self) private var model

  // MARK: Body
  var body: some View {
    StepScaffold(
      title: "Try grayscale",
      subtitle: "Optional. Color is what makes apps irresistible; without it, your phone gets a lot less interesting."
    ) {
      NumberedSteps(
        steps: OnboardingGuide.instructions(
          for: .grayscale,
          systemMajorVersion: model.systemMajorVersion,
          appearance: model.configuration.theme.appearance
        )
      )
    } actions: {
      ShortcutInstallButton(shortcut: .grayscale, title: "Add Grayscale Shortcut")
      Button("Continue") { model.complete(.grayscale) }
        .buttonStyle(SecondaryButtonStyle())
    }
  }
}
