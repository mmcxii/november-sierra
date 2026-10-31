import PlaintextKit
import SwiftUI

#if canImport(UIKit)
  import UIKit
#endif

/// Resolves the theme against the surrounding color scheme: follows it in `system`, overrides it when pinned,
/// so every view inside reads matching colors from `\.colorScheme`.
struct ThemeAppearance: ViewModifier {
  // MARK: Inputs
  let theme: Theme

  // MARK: State
  @Environment(\.colorScheme) private var systemScheme

  // MARK: Body
  func body(content: Content) -> some View {
    content.environment(\.colorScheme, theme.variant(system: systemScheme.themeVariant).colorScheme)
  }
}

extension View {
  func themeAppearance(_ theme: Theme) -> some View {
    modifier(ThemeAppearance(theme: theme))
  }
}
