import PlaintextKit
import SwiftUI

struct RootView: View {
  // MARK: State
  @Environment(AppModel.self) private var model
  @Environment(\.colorScheme) private var colorScheme

  // MARK: Body
  var body: some View {
    @Bindable var model = model
    ZStack {
      if model.state.onboarding.isFinished {
        HomeView()
      } else {
        OnboardingView()
      }
      if model.isShowingHandoff {
        model.configuration.theme.colors(for: colorScheme).background.color
          .ignoresSafeArea()
          .transition(.identity)
      }
    }
    .sheet(item: $model.pendingSetup) { requirement in
      SetupRequirementView(requirement: requirement)
    }
    .sheet(isPresented: $model.isShowingPaywall) {
      PaywallView()
    }
  }
}
