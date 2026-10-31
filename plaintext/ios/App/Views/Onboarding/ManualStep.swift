import PlaintextKit
import SwiftUI

struct ManualStep: View {
  // MARK: Inputs
  let step: OnboardingStep

  // MARK: State
  @Environment(AppModel.self) private var model

  // MARK: Variables
  private var title: String {
    switch step {
    case .addWidgets: "Add the widget"
    case .hideDockAndBorders: "Clear the dock"
    case .hidePages: "Hide the other pages"
    default: ""
    }
  }

  private var subtitle: String? {
    switch step {
    case .addWidgets:
      OnboardingGuide.usesFullPageLauncher(systemMajorVersion: model.systemMajorVersion)
        ? "One full-page widget. Pick a page, and a header if you want one."
        : "Any size. Pick a page, and a header if you want one."
    case .hideDockAndBorders: "So nothing frames your words but the wallpaper."
    case .hidePages: "Swiping should lead nowhere. Your apps stay in the App Library."
    default: nil
    }
  }

  // MARK: Body
  var body: some View {
    let instructions = OnboardingGuide.instructions(
      for: step,
      systemMajorVersion: model.systemMajorVersion,
      appearance: model.configuration.theme.appearance
    )
    StepScaffold(title: title, subtitle: subtitle) {
      InstructionVideo(step: step, systemMajorVersion: model.systemMajorVersion)
        .frame(maxWidth: .infinity)
      NumberedSteps(steps: instructions)
    } actions: {
      Button("Done") { model.complete(step) }
        .buttonStyle(PrimaryButtonStyle())
    }
  }
}
