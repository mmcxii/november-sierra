import AppIntents
import PlaintextKit
import SwiftUI
import WidgetKit

struct LauncherView: View {
  // MARK: Inputs
  let items: [LauncherItem]
  let theme: Theme
  var maxRows: Int
  /// Widgets wire rows to `LaunchItemIntent`; in-app previews render the same rows as plain text.
  var isInteractive = true
  var scale: Double = 1
  /// When a catalog app was renamed, the page card shows that original name beside the label.
  var originalName: ((LauncherItem) -> String?)? = nil

  // MARK: State
  @Environment(\.colorScheme) private var colorScheme

  // MARK: Variables
  private var rowSpacing: Double {
    theme.textSize.launcherPointSize * 0.55 * scale
  }

  // MARK: Body
  var body: some View {
    VStack(alignment: theme.horizontalAlignment, spacing: rowSpacing) {
      ForEach(items.prefix(maxRows)) { item in
        row(for: item)
      }
    }
    .frame(maxWidth: .infinity, alignment: theme.frameAlignment)
  }

  // MARK: Handlers
  @ViewBuilder
  private func row(for item: LauncherItem) -> some View {
    let textColor = theme.colors(for: colorScheme).text.color
    let label = HStack(spacing: 8 * scale) {
      Text(item.label)
        .lineLimit(1)
        .layoutPriority(1)
      if let original = originalName?(item) {
        Text(original)
          .foregroundStyle(textColor.opacity(0.35))
          .strikethrough(true, color: textColor.opacity(0.35))
          .lineLimit(1)
      }
    }
    .font(theme.font(size: theme.textSize.launcherPointSize * scale))
    .foregroundStyle(textColor)
    .lineLimit(1)
    .widgetAccentable()
    if isInteractive {
      Button(intent: LaunchItemIntent(itemID: item.id)) {
        label.frame(maxWidth: .infinity, alignment: theme.frameAlignment)
          .contentShape(Rectangle())
      }
      .buttonStyle(.plain)
    } else {
      label
    }
  }
}
