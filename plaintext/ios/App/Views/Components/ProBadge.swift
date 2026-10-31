import PlaintextKit
import SwiftUI

struct ProBadge: View {
  var body: some View {
    Text("PRO")
      .font(.caption2.weight(.semibold))
      .padding(.horizontal, 6)
      .padding(.vertical, 2)
      .overlay(Capsule().stroke(.secondary))
      .foregroundStyle(.secondary)
  }
}
