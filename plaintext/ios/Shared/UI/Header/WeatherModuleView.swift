import PlaintextKit
import SwiftUI
import WidgetKit

struct WeatherModuleView: View {
  // MARK: Inputs
  let style: WeatherStyle
  let content: HeaderContent
  let size: Double

  // MARK: State
  @Environment(\.colorScheme) private var colorScheme

  // MARK: Variables
  private var textColor: Color { content.theme.colors(for: colorScheme).text.color }

  // MARK: Body
  var body: some View {
    if let weather = content.weather {
      switch style.kind {
      case .current:
        HStack(spacing: 6) {
          symbol(weather.symbolName)
          Text(
            "\(TemperatureFormatter.format(celsius: weather.temperatureCelsius, preference: content.preferences.temperatureUnit)) \(weather.conditionDescription)"
          )
        }
        .font(content.theme.font(size: size))
        .foregroundStyle(textColor)
      case .fiveDay, .tenDay:
        HStack(spacing: 0) {
          ForEach(weather.forecast(days: style.kind == .fiveDay ? 5 : 10), id: \.date) { day in
            VStack(spacing: 3) {
              Text(day.date.formatted(.dateTime.weekday(.narrow)))
                .opacity(0.6)
              symbol(day.symbolName)
              Text(
                TemperatureFormatter.format(celsius: day.highCelsius, preference: content.preferences.temperatureUnit))
            }
            .frame(maxWidth: .infinity)
          }
        }
        .font(content.theme.font(size: style.kind == .fiveDay ? size * 0.8 : size * 0.6))
        .foregroundStyle(textColor)
      }
    } else {
      Text("Weather unavailable")
        .font(content.theme.font(size: size))
        .foregroundStyle(textColor.opacity(0.5))
    }
  }

  // MARK: Handlers
  @ViewBuilder
  private func symbol(_ name: String) -> some View {
    if style.coloredIcons {
      Image(systemName: name)
        .symbolRenderingMode(.multicolor)
        .widgetAccentedRenderingMode(.fullColor)
    } else {
      Image(systemName: name)
    }
  }
}
