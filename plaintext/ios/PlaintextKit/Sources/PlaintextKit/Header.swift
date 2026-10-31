import Foundation

public enum HeaderModule: Codable, Hashable, Sendable {
  case digitalClock
  case analogClock
  case date(DateStyle)
  case weather(WeatherStyle)
  case countdown(CountdownKind)
  case quote
  case nextEvent
}

public enum DateStyle: String, Codable, CaseIterable, Sendable {
  /// "Tuesday, October 27"
  case weekdayMonthDay
  /// "Tuesday"
  case weekday
  /// "October 27"
  case monthDay
  /// "Tue 27"
  case shortWeekdayDay
  /// "10/27/2026"
  case numeric
  /// "2026-10-27"
  case iso
  /// "October 2026"
  case monthYear
  /// "Day 300"
  case dayOfYear
  /// "Week 44"
  case weekOfYear
}

public struct WeatherStyle: Codable, Hashable, Sendable {
  public enum Kind: String, Codable, CaseIterable, Sendable {
    case current
    case fiveDay
    case tenDay
  }

  public var kind: Kind
  public var coloredIcons: Bool

  public init(kind: Kind = .current, coloredIcons: Bool = false) {
    self.kind = kind
    self.coloredIcons = coloredIcons
  }

  public static let current = WeatherStyle()
}

public enum CountdownKind: String, Codable, CaseIterable, Sendable {
  case day
  case month
  case year
  case life
}

public struct HeaderConfiguration: Codable, Hashable, Sendable {
  public enum Arrangement: String, Codable, CaseIterable, Sendable {
    /// A large primary module with an optional caption line of date and weather beneath it.
    case classic
    case sideBySide
    case stacked
  }

  public var arrangement: Arrangement
  public var primary: HeaderModule
  public var secondary: HeaderModule
  public var showsDateCaption: Bool
  public var showsWeatherCaption: Bool

  public init(
    arrangement: Arrangement,
    primary: HeaderModule,
    secondary: HeaderModule,
    showsDateCaption: Bool,
    showsWeatherCaption: Bool
  ) {
    self.arrangement = arrangement
    self.primary = primary
    self.secondary = secondary
    self.showsDateCaption = showsDateCaption
    self.showsWeatherCaption = showsWeatherCaption
  }

  public static let `default` = HeaderConfiguration(
    arrangement: .classic,
    primary: .digitalClock,
    secondary: .date(.weekdayMonthDay),
    showsDateCaption: true,
    showsWeatherCaption: true
  )

  /// The modules actually rendered, in reading order.
  public var visibleModules: [HeaderModule] {
    switch arrangement {
    case .classic:
      var modules = [primary]
      if showsDateCaption { modules.append(.date(.weekdayMonthDay)) }
      if showsWeatherCaption { modules.append(.weather(.current)) }
      return modules
    case .sideBySide, .stacked:
      return [primary, secondary]
    }
  }
}
