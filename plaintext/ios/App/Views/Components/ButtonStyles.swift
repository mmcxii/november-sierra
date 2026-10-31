import PlaintextKit
import SwiftUI

struct PrimaryButtonStyle: ButtonStyle {
  @Environment(\.isEnabled) private var isEnabled

  func makeBody(configuration: ButtonStyleConfiguration) -> some View {
    configuration.label
      .font(.headline)
      .frame(maxWidth: .infinity)
      .padding(.vertical, 16)
      .foregroundStyle(Color(uiColor: .systemBackground))
      .background(Color.primary.opacity(isEnabled ? 1 : 0.3), in: Capsule())
      .opacity(configuration.isPressed ? 0.7 : 1)
  }
}

struct SecondaryButtonStyle: ButtonStyle {
  func makeBody(configuration: ButtonStyleConfiguration) -> some View {
    configuration.label
      .font(.headline)
      .frame(maxWidth: .infinity)
      .padding(.vertical, 14)
      .foregroundStyle(.primary)
      .opacity(configuration.isPressed ? 0.5 : 1)
  }
}
