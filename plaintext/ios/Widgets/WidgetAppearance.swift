import PlaintextKit
import SwiftUI
import WidgetKit

/// WidgetKit re-renders the same entries when the device switches appearance, so reading `\.colorScheme` here
/// is enough for widgets to follow light and dark mode without a timeline reload or being re-added.
struct WidgetAppearance: ViewModifier {
  // MARK: Inputs
  let theme: Theme

  // MARK: State
  @Environment(\.colorScheme) private var systemScheme

  // MARK: Body
  func body(content: Content) -> some View {
    content
      .containerBackground(for: .widget) {
        theme.colors(for: systemScheme).background.color
      }
      .themeAppearance(theme)
  }
}
