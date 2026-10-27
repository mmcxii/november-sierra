import PlaintextKit
import SwiftUI

/// One header layout, as the widget draws it, without a page underneath.
struct HeaderPreview: View {
  // MARK: Inputs
  let layout: HeaderLayout

  // MARK: State
  @Environment(AppModel.self) private var model
  @Environment(\.colorScheme) private var colorScheme

  // MARK: Body
  var body: some View {
    let theme = model.configuration.theme
    TimelineView(.everyMinute) { context in
      HeaderView(
        content: HeaderContent(
          date: context.date,
          header: layout.configuration,
          preferences: model.configuration.preferences,
          theme: theme,
          weather: model.state.weather,
          quote: QuoteOfTheDay.quote(for: context.date, from: QuoteOfTheDay.bundled()),
          nextEvent: nil
        ),
        scale: 0.8
      )
      .padding(16)
      .frame(
        maxWidth: .infinity,
        minHeight: 120,
        alignment: Alignment(horizontal: theme.horizontalAlignment, vertical: .top)
      )
      .background(
        theme.colors(for: colorScheme).background.color,
        in: RoundedRectangle(cornerRadius: 22, style: .continuous)
      )
    }
    .accessibilityElement(children: .combine)
    .accessibilityLabel(layout.name)
  }
}
