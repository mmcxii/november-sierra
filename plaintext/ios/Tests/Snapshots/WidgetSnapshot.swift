import CoreGraphics
import PlaintextKit
import Testing
import WidgetKit

/// One rendered page widget: a size, a theme, and the appearance the device is in.
struct WidgetSnapshot: Sendable, CustomTestStringConvertible {
  enum Size: String, CaseIterable, Sendable {
    case small
    case medium
    case large

    /// Point sizes on a 402pt-wide iPhone 17 Pro home screen.
    var size: CGSize {
      switch self {
      case .small: CGSize(width: 170, height: 170)
      case .medium: CGSize(width: 364, height: 170)
      case .large: CGSize(width: 364, height: 382)
      }
    }

    var family: WidgetFamily {
      switch self {
      case .small: .systemSmall
      case .medium: .systemMedium
      case .large: .systemLarge
      }
    }
  }

  var size: Size
  var label: String
  var theme: Theme
  var device: ThemeVariant
  /// `nil` draws the page alone, the way a widget looks when its header slot is left blank.
  var header: HeaderConfiguration? = .default

  var name: String { "\(size.rawValue)_\(label)" }
  var testDescription: String { name }
}

extension WidgetSnapshot {
  static let all = appearanceMatrix + styleSamples

  /// Every size in every appearance setting, on a light and a dark device, with default and custom backgrounds.
  private static let appearanceMatrix: [WidgetSnapshot] = {
    let palettes = [
      (light: Theme.lightPresets[0], dark: Theme.darkPresets[0]),
      (light: Theme.lightPresets[1], dark: Theme.darkPresets[1]),
    ]
    var snapshots: [WidgetSnapshot] = []
    for size in Size.allCases {
      for palette in palettes {
        for appearance in Theme.Appearance.allCases {
          for device in ThemeVariant.allCases {
            let colors = "\(palette.light.name)-\(palette.dark.name)".lowercased()
            snapshots.append(
              WidgetSnapshot(
                size: size,
                label: "\(appearance.rawValue)-widgets_\(device.rawValue)-device_\(colors)",
                theme: Theme(
                  appearance: appearance,
                  lightBackground: palette.light.color,
                  darkBackground: palette.dark.color
                ),
                device: device
              )
            )
          }
        }
      }
    }
    return snapshots
  }()

  private static let styleSamples = [
    WidgetSnapshot(
      size: .large,
      label: "serif-large-centered",
      theme: Theme(
        lightBackground: Theme.lightPresets[1].color,
        typeface: .serif,
        textSize: .large,
        alignment: .center
      ),
      device: .light
    ),
    WidgetSnapshot(
      size: .large,
      label: "side-by-side-analog-five-day",
      theme: .default,
      device: .light,
      header: HeaderConfiguration(
        arrangement: .sideBySide,
        primary: .analogClock,
        secondary: .weather(WeatherStyle(kind: .fiveDay)),
        showsDateCaption: false,
        showsWeatherCaption: false
      )
    ),
    WidgetSnapshot(
      size: .large,
      label: "stacked-clock-quote",
      theme: Theme(typeface: .serif),
      device: .dark,
      header: HeaderConfiguration(
        arrangement: .stacked,
        primary: .digitalClock,
        secondary: .quote,
        showsDateCaption: false,
        showsWeatherCaption: false
      )
    ),
    WidgetSnapshot(
      size: .large,
      label: "no-header",
      theme: .default,
      device: .light,
      header: nil
    ),
    WidgetSnapshot(
      size: .large,
      label: "side-by-side-date-year-countdown",
      theme: Theme(typeface: .rounded),
      device: .light,
      header: HeaderConfiguration(
        arrangement: .sideBySide,
        primary: .date(.weekdayMonthDay),
        secondary: .countdown(.year),
        showsDateCaption: false,
        showsWeatherCaption: false
      )
    ),
  ]
}
