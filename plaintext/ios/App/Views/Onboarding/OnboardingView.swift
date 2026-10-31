import PlaintextKit
import SwiftUI

struct OnboardingView: View {
  // MARK: State
  @Environment(AppModel.self) private var model

  // MARK: Body
  var body: some View {
    let steps = model.onboardingSteps
    let current = model.state.onboarding.nextStep(in: steps) ?? .finish
    let position = (steps.firstIndex(of: current) ?? 0) + 1

    VStack(spacing: 0) {
      ProgressView(value: Double(position), total: Double(steps.count))
        .tint(.primary)
        .padding(.horizontal, 24)
        .padding(.top, 8)
        .accessibilityLabel("Step \(position) of \(steps.count)")
      OnboardingStepView(step: current)
        .id(current)
        .transition(.asymmetric(insertion: .move(edge: .trailing), removal: .opacity))
    }
    .animation(.smooth, value: current)
  }
}
