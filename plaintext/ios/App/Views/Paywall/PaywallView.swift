import PlaintextKit
import SwiftUI

struct PaywallView: View {
  // MARK: State
  @Environment(\.dismiss) private var dismiss

  // MARK: Body
  var body: some View {
    NavigationStack {
      ScrollView {
        ProOffer()
          .padding(24)
      }
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Not now") { dismiss() }
        }
      }
    }
    .presentationDetents([.large])
  }
}
