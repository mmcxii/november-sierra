import Foundation

public struct WeatherSnapshot: Codable, Hashable, Sendable {
  public struct Day: Codable, Hashable, Sendable {
    public var date: Date
    public var highCelsius: Double
    public var lowCelsius: Double
    public var symbolName: String

    public init(date: Date, highCelsius: Double, lowCelsius: Double, symbolName: String) {
      self.date = date
      self.highCelsius = highCelsius
      self.lowCelsius = lowCelsius
      self.symbolName = symbolName
    }
  }

  public var fetchedAt: Date
  public var temperatureCelsius: Double
  public var conditionDescription: String
  public var symbolName: String
  public var daily: [Day]

  public init(
    fetchedAt: Date,
    temperatureCelsius: Double,
    conditionDescription: String,
    symbolName: String,
    daily: [Day]
  ) {
    self.fetchedAt = fetchedAt
    self.temperatureCelsius = temperatureCelsius
    self.conditionDescription = conditionDescription
    self.symbolName = symbolName
    self.daily = daily
  }

  /// WeatherKit allows 500k calls a month; at most one fetch per half hour per device keeps us far below it.
  public static let refreshInterval: TimeInterval = 30 * 60

  public func isStale(now: Date) -> Bool {
    now.timeIntervalSince(fetchedAt) >= Self.refreshInterval
  }

  public func forecast(days: Int) -> [Day] {
    Array(daily.prefix(days))
  }
}

public enum TemperatureFormatter {
  public static func resolvedUnit(
    _ preference: Preferences.TemperatureUnit,
    locale: Locale = .current
  ) -> Preferences.TemperatureUnit {
    guard preference == .system else { return preference }
    return locale.measurementSystem == .us ? .fahrenheit : .celsius
  }

  /// "64°" — the unit letter is omitted, matching the minimalist style of the header.
  public static func format(
    celsius: Double,
    preference: Preferences.TemperatureUnit,
    locale: Locale = .current
  ) -> String {
    let value =
      resolvedUnit(preference, locale: locale) == .fahrenheit ? celsius * 9 / 5 + 32 : celsius
    return "\(Int(value.rounded()))°"
  }
}
