import PlaintextKit
import SwiftUI

/// One page's apps. A renamed catalog app keeps its label, with the original name faded and struck through.
struct PagePreview: View {
  // MARK: Inputs
  let page: LauncherPage

  // MARK: State
  @Environment(AppModel.self) private var model
  @Environment(\.colorScheme) private var colorScheme

  // MARK: Body
  var body: some View {
    let theme = model.configuration.theme
    let text = theme.colors(for: colorScheme).text.color
    VStack(alignment: theme.horizontalAlignment, spacing: 0) {
      if page.items.isEmpty {
        Text("No apps yet")
          .font(theme.font(size: 16))
          .foregroundStyle(text.opacity(0.45))
      } else {
        LauncherView(
          items: page.items,
          theme: theme,
          maxRows: 8,
          isInteractive: false,
          scale: 0.8,
          originalName: { item in originalName(item) }
        )
      }
    }
    .padding(16)
    .frame(
      maxWidth: .infinity,
      minHeight: 180,
      alignment: Alignment(horizontal: theme.horizontalAlignment, vertical: .top)
    )
    .background(
      theme.colors(for: colorScheme).background.color,
      in: RoundedRectangle(cornerRadius: 22, style: .continuous)
    )
    .accessibilityElement(children: .combine)
    .accessibilityLabel(page.name)
  }

  // MARK: Handlers
  private func originalName(_ item: LauncherItem) -> String? {
    guard case .catalog(let id) = item.target else { return nil }
    guard let name = model.catalog.app(id: id)?.name, name != item.label else { return nil }
    return name
  }
}
