import PlaintextKit
import SwiftUI

struct ThemeStep: View {
  // MARK: State
  @Environment(AppModel.self) private var model

  // MARK: Body
  var body: some View {
    StepScaffold(title: "Make it yours", subtitle: "Quiet by default. Change it whenever you like.") {
      ThemeControls()
      HomeScreenPreview()
    } actions: {
      Button("Continue") { model.complete(.theme) }
        .buttonStyle(PrimaryButtonStyle())
    }
  }
}
