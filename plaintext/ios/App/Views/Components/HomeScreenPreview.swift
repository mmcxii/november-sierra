import PlaintextKit
import SwiftUI

/// One page as its widget will look: the header and that page's apps, in separate regions.
struct HomeScreenPreview: View {
  // MARK: Inputs
  var page: LauncherPage?

  // MARK: State
  @Environment(AppModel.self) private var model
  @Environment(\.colorScheme) private var colorScheme

  // MARK: Body
  var body: some View {
    let configuration = model.entitlements.effective(model.configuration)
    let theme = configuration.theme
    let shown = page ?? configuration.pages.first
    let background = theme.colors(for: colorScheme).background.color
    TimelineView(.everyMinute) { context in
      VStack(alignment: .leading, spacing: 14) {
        region("Header", alignment: theme.horizontalAlignment, background: background) {
          HeaderView(
            content: HeaderContent(
              date: context.date,
              header: configuration.headers.first?.configuration ?? .default,
              preferences: configuration.preferences,
              theme: theme,
              weather: model.state.weather,
              quote: QuoteOfTheDay.quote(for: context.date, from: QuoteOfTheDay.bundled()),
              nextEvent: nil
            ),
            scale: 0.8
          )
        }
        region(shown?.name ?? "Apps", alignment: theme.horizontalAlignment, background: background) {
          let items = shown?.items ?? []
          if items.isEmpty {
            Text("No apps yet")
              .font(theme.font(size: 16))
              .foregroundStyle(theme.colors(for: colorScheme).text.color.opacity(0.45))
          } else {
            LauncherView(items: items, theme: theme, maxRows: 8, isInteractive: false, scale: 0.8)
          }
        }
      }
      .padding(16)
      .frame(maxWidth: .infinity, minHeight: 420, alignment: .topLeading)
      .background(Color.primary.opacity(0.06), in: RoundedRectangle(cornerRadius: 36, style: .continuous))
    }
    .accessibilityElement(children: .combine)
    .accessibilityLabel("Preview of \(shown?.name ?? "your page"), header and apps")
  }

  // MARK: Handlers
  private func region<Content: View>(
    _ title: String,
    alignment: HorizontalAlignment,
    background: Color,
    @ViewBuilder content: () -> Content
  ) -> some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(title)
        .font(.caption.weight(.medium))
        .foregroundStyle(.secondary)
      content()
        .padding(16)
        .frame(maxWidth: .infinity, minHeight: 88, alignment: Alignment(horizontal: alignment, vertical: .top))
        .background(background, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
    }
  }
}
