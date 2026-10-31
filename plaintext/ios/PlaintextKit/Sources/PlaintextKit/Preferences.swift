import Foundation

public struct Preferences: Codable, Hashable, Sendable {
  public enum ClockFormat: String, Codable, CaseIterable, Sendable {
    case system
    case twelveHour
    case twentyFourHour
  }

  public enum TemperatureUnit: String, Codable, CaseIterable, Sendable {
    case system
    case fahrenheit
    case celsius
  }

  public enum WeatherLocation: Codable, Hashable, Sendable {
    case current
    case fixed(name: String, latitude: Double, longitude: Double)
  }

  public var clockFormat: ClockFormat
  public var temperatureUnit: TemperatureUnit
  public var weatherLocation: WeatherLocation
  public var birthYear: Int?
  public var lifeExpectancyYears: Int

  public init(
    clockFormat: ClockFormat = .system,
    temperatureUnit: TemperatureUnit = .system,
    weatherLocation: WeatherLocation = .current,
    birthYear: Int? = nil,
    lifeExpectancyYears: Int = 80
  ) {
    self.clockFormat = clockFormat
    self.temperatureUnit = temperatureUnit
    self.weatherLocation = weatherLocation
    self.birthYear = birthYear
    self.lifeExpectancyYears = lifeExpectancyYears
  }

  public static let `default` = Preferences()
}

public struct RGBAColor: Codable, Hashable, Sendable {
  public var red: Double
  public var green: Double
  public var blue: Double
  public var alpha: Double

  public init(red: Double, green: Double, blue: Double, alpha: Double = 1) {
    self.red = red
    self.green = green
    self.blue = blue
    self.alpha = alpha
  }

  public init(white: Double) {
    self.init(red: white, green: white, blue: white)
  }

  /// WCAG relative luminance, used to pick legible text over a background color.
  public var luminance: Double {
    func channel(_ value: Double) -> Double {
      value <= 0.03928 ? value / 12.92 : pow((value + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
  }

  public var isDark: Bool { luminance < 0.4 }
}
