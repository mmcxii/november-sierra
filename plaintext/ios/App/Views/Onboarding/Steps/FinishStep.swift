import PlaintextKit
import SwiftUI

struct FinishStep: View {
  // MARK: State
  @Environment(AppModel.self) private var model

  // MARK: Body
  var body: some View {
    StepScaffold(title: "That's it.", subtitle: "Go look at your home screen. It's quiet now.") {
      ProOffer()
    } actions: {
      Button("Done") { model.complete(.finish) }
        .buttonStyle(PrimaryButtonStyle())
    }
  }
}
