import PlaintextKit
import SwiftUI

/// Shared layout: a scrolling body with the step's actions pinned to the bottom.
struct StepScaffold<Content: View, Actions: View>: View {
  let title: String
  var subtitle: String?
  @ViewBuilder var content: Content
  @ViewBuilder var actions: Actions

  var body: some View {
    VStack(spacing: 0) {
      ScrollView {
        VStack(alignment: .leading, spacing: 24) {
          VStack(alignment: .leading, spacing: 8) {
            Text(title)
              .font(.largeTitle.weight(.semibold))
            if let subtitle {
              Text(subtitle)
                .font(.title3)
                .foregroundStyle(.secondary)
            }
          }
          content
        }
        .padding(24)
        .frame(maxWidth: .infinity, alignment: .leading)
      }
      VStack(spacing: 4) {
        actions
      }
      .padding(.horizontal, 24)
      .padding(.bottom, 12)
    }
  }
}
