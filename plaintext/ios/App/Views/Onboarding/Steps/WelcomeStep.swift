import PlaintextKit
import SwiftUI

struct WelcomeStep: View {
  // MARK: State
  @Environment(AppModel.self) private var model

  // MARK: Body
  var body: some View {
    StepScaffold(title: "Plaintext", subtitle: "A calm phone, in plain words.") {
      VStack(alignment: .leading, spacing: 18) {
        Label("Your apps become a short list of words. No icons, no badges.", systemImage: "text.alignleft")
        Label("Taps open apps directly. No detours.", systemImage: "arrow.up.forward")
        Label("Setup takes about five minutes. We'll walk you through every switch.", systemImage: "hand.point.up")
        Label("One payment for extras. No subscriptions, ever.", systemImage: "heart")
      }
      .font(.body)
    } actions: {
      Button("Begin") { model.complete(.welcome) }
        .buttonStyle(PrimaryButtonStyle())
    }
  }
}
