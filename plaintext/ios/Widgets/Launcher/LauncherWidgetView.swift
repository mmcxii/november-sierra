import PlaintextKit
import SwiftUI
import WidgetKit

struct LauncherWidgetView: View {
  // MARK: Inputs
  let entry: LauncherEntry
  /// Snapshot tests render outside WidgetKit, where `\.widgetFamily` can't be set.
  var family: WidgetFamily?

  // MARK: State
  @Environment(\.widgetFamily) private var environmentFamily
  @Environment(\.colorScheme) private var colorScheme

  // MARK: Variables
  private var theme: Theme { entry.configuration.theme }
  private var resolvedFamily: WidgetFamily { family ?? environmentFamily }
  private var mutedText: Color { theme.colors(for: colorScheme).text.color.opacity(0.6) }

  private var scale: Double {
    switch resolvedFamily {
    case .systemSmall: 0.65
    case .systemMedium: 0.8
    default: 1
    }
  }

  private var showsPage: Bool {
    entry.isLockedPage || entry.page != nil
  }

  // MARK: Body
  var body: some View {
    GeometryReader { proxy in
      VStack(alignment: theme.horizontalAlignment, spacing: 14) {
        if entry.isUnavailable {
          prompt("Open Plaintext")
        } else {
          if let header = entry.header {
            HeaderView(content: header, scale: scale)
          }
          if entry.isLockedHeader {
            prompt("Unlock Plaintext Pro to use more headers")
          }
          if entry.header != nil, showsPage {
            Rectangle()
              .fill(mutedText.opacity(0.35))
              .frame(height: 1)
          }
          if entry.isLockedPage {
            prompt("Unlock Plaintext Pro to use more pages")
          } else if let page = entry.page, !page.items.isEmpty {
            LauncherView(
              items: page.items,
              theme: theme,
              maxRows: rows(height: proxy.size.height),
              scale: scale
            )
          } else if entry.page != nil {
            prompt("Tap to add apps")
          }
        }
        Spacer(minLength: 0)
      }
      .padding(.horizontal, 20)
      .padding(.vertical, 16)
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
    .modifier(WidgetAppearance(theme: theme))
    .widgetURL(entry.isUnavailable || entry.isLockedPage || entry.isLockedHeader ? DeepLink.settings.url : nil)
  }

  // MARK: Handlers
  private func prompt(_ title: String) -> some View {
    Link(destination: DeepLink.settings.url) {
      Text(title)
        .font(theme.font(size: theme.textSize.launcherPointSize * scale))
        .foregroundStyle(mutedText)
    }
  }

  private func rows(height: Double) -> Int {
    let headerBlock = entry.header == nil ? 0.0 : 108 * scale
    let available = height - headerBlock - 32
    let rowHeight = theme.textSize.launcherPointSize * scale * 1.75
    guard rowHeight > 0 else { return 1 }
    return max(1, Int(available / rowHeight))
  }
}
