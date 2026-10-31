import PlaintextKit
import SwiftUI
import WidgetKit

struct HeaderModuleView: View {
  // MARK: Types
  enum Prominence {
    case primary
    case secondary
  }

  // MARK: Inputs
  let module: HeaderModule
  let content: HeaderContent
  let prominence: Prominence
  let scale: Double

  // MARK: State
  @Environment(\.colorScheme) private var colorScheme

  // MARK: Variables
  private var theme: Theme { content.theme }
  private var textColor: Color { theme.colors(for: colorScheme).text.color }
  private var bodySize: Double { (prominence == .primary ? 20 : 16) * scale }

  // MARK: Body
  var body: some View {
    switch module {
    case .digitalClock:
      let reading = ClockFormatter.reading(at: content.date, format: content.preferences.clockFormat)
      HStack(alignment: .firstTextBaseline, spacing: 4 * scale) {
        Text(reading.time)
          .font(theme.font(size: (prominence == .primary ? 56 : 34) * scale, weight: .light))
          .monospacedDigit()
        if let period = reading.period {
          Text(period)
            .font(theme.font(size: 15 * scale))
            .opacity(0.7)
        }
      }
      .foregroundStyle(textColor)
      .widgetAccentable()
    case .analogClock:
      let reading = ClockFormatter.reading(at: content.date, format: .twentyFourHour)
      AnalogClockView(hour: reading.hour, minute: reading.minute, color: textColor)
        .frame(width: (prominence == .primary ? 76 : 56) * scale, height: (prominence == .primary ? 76 : 56) * scale)
        .widgetAccentable()
    case .date(let style):
      text(DateLineFormatter.string(for: content.date, style: style))
    case .weather(let style):
      WeatherModuleView(style: style, content: content, size: bodySize)
    case .countdown(let kind):
      if let value = Countdown.value(kind, at: content.date, preferences: content.preferences) {
        VStack(alignment: theme.horizontalAlignment, spacing: 4 * scale) {
          text(value.label)
          ProgressBar(fraction: value.fractionElapsed, color: textColor)
            .frame(width: 120 * scale, height: 2 * scale)
        }
      } else {
        text(kind == .life ? "Add your birth year in Settings" : "")
      }
    case .quote:
      if let quote = content.quote {
        VStack(alignment: theme.horizontalAlignment, spacing: 2 * scale) {
          text("\u{201C}\(quote.text)\u{201D}")
            .lineLimit(3)
            .minimumScaleFactor(0.7)
          Text("— \(quote.author)")
            .font(theme.font(size: 12 * scale))
            .foregroundStyle(textColor.opacity(0.6))
        }
      }
    case .nextEvent:
      if let event = content.nextEvent {
        let time = ClockFormatter.reading(at: event.start, format: content.preferences.clockFormat)
        text("\(time.time)\(time.period.map { " \($0)" } ?? "")  \(event.title)")
          .lineLimit(1)
      } else {
        text("Nothing else today")
          .opacity(0.6)
      }
    }
  }

  // MARK: Handlers
  private func text(_ string: String) -> some View {
    Text(string)
      .font(theme.font(size: bodySize))
      .foregroundStyle(textColor)
      .multilineTextAlignment(theme.textAlignment)
  }
}
