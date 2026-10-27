import PlaintextKit
import SwiftUI

struct ShortcutInstallButton: View {
  // MARK: Inputs
  let shortcut: PrebuiltShortcut
  let title: String

  // MARK: State
  @Environment(\.openURL) private var openURL

  // MARK: Body
  var body: some View {
    if let url = ShortcutLinks.url(for: shortcut) {
      Button(title) { openURL(url) }
        .buttonStyle(PrimaryButtonStyle())
    } else {
      VStack(alignment: .leading, spacing: 6) {
        Button(title) {}
          .buttonStyle(PrimaryButtonStyle())
          .disabled(true)
        Text("This shortcut isn't published yet. You can build it by hand from the setup guide.")
          .font(.footnote)
          .foregroundStyle(.secondary)
      }
    }
  }
}
