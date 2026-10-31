import PlaintextKit
import SwiftUI

struct OnboardingStepView: View {
  let step: OnboardingStep

  var body: some View {
    switch step {
    case .welcome: WelcomeStep()
    case .pickApps: PickAppsStep()
    case .theme: ThemeStep()
    case .wallpaper: WallpaperStep()
    case .addWidgets, .hideDockAndBorders, .hidePages: ManualStep(step: step)
    case .assistant: AssistantStep()
    case .phoneShortcut: PhoneShortcutStep()
    case .grayscale: GrayscaleStep()
    case .finish: FinishStep()
    }
  }
}
