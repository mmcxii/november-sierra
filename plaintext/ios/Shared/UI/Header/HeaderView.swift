import PlaintextKit
import SwiftUI

struct HeaderView: View {
  // MARK: Inputs
  let content: HeaderContent
  var scale: Double = 1

  // MARK: State
  @Environment(\.colorScheme) private var colorScheme

  // MARK: Variables
  private var caption: String? {
    var parts: [String] = []
    if content.header.showsDateCaption {
      parts.append(DateLineFormatter.string(for: content.date, style: .weekdayMonthDay))
    }
    if content.header.showsWeatherCaption, let weather = content.weather {
      let temperature = TemperatureFormatter.format(
        celsius: weather.temperatureCelsius,
        preference: content.preferences.temperatureUnit
      )
      parts.append("\(temperature) \(weather.conditionDescription)")
    }
    return parts.isEmpty ? nil : parts.joined(separator: " · ")
  }

  // MARK: Body
  var body: some View {
    switch content.header.arrangement {
    case .classic:
      VStack(alignment: content.theme.horizontalAlignment, spacing: 4 * scale) {
        HeaderModuleView(module: content.header.primary, content: content, prominence: .primary, scale: scale)
        if let caption {
          Text(caption)
            .font(content.theme.font(size: 15 * scale))
            .foregroundStyle(content.theme.colors(for: colorScheme).text.color.opacity(0.7))
        }
      }
      .frame(maxWidth: .infinity, alignment: content.theme.frameAlignment)
    case .sideBySide:
      HStack(alignment: .center, spacing: 16 * scale) {
        HeaderModuleView(module: content.header.primary, content: content, prominence: .primary, scale: scale)
          .frame(maxWidth: .infinity, alignment: .leading)
        HeaderModuleView(module: content.header.secondary, content: content, prominence: .secondary, scale: scale)
          .frame(maxWidth: .infinity, alignment: .trailing)
      }
    case .stacked:
      VStack(alignment: content.theme.horizontalAlignment, spacing: 6 * scale) {
        HeaderModuleView(module: content.header.primary, content: content, prominence: .primary, scale: scale)
        HeaderModuleView(module: content.header.secondary, content: content, prominence: .secondary, scale: scale)
      }
      .frame(maxWidth: .infinity, alignment: content.theme.frameAlignment)
    }
  }
}
