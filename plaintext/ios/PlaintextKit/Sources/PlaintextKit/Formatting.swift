import Foundation

public struct ClockReading: Hashable, Sendable {
  public var time: String
  /// "AM"/"PM" for twelve-hour clocks, rendered smaller beside the time.
  public var period: String?
  public var hour: Int
  public var minute: Int
}

public enum ClockFormatter {
  public static func usesTwentyFourHour(_ format: Preferences.ClockFormat, locale: Locale = .current) -> Bool {
    switch format {
    case .twelveHour: false
    case .twentyFourHour: true
    case .system: !(DateFormatter.dateFormat(fromTemplate: "j", options: 0, locale: locale) ?? "").contains("a")
    }
  }

  public static func reading(
    at date: Date,
    format: Preferences.ClockFormat,
    calendar: Calendar = .current,
    locale: Locale = .current
  ) -> ClockReading {
    let components = calendar.dateComponents([.hour, .minute], from: date)
    let hour = components.hour ?? 0
    let minute = components.minute ?? 0
    let minuteText = minute < 10 ? "0\(minute)" : "\(minute)"
    if usesTwentyFourHour(format, locale: locale) {
      let hourText = hour < 10 ? "0\(hour)" : "\(hour)"
      return ClockReading(time: "\(hourText):\(minuteText)", period: nil, hour: hour, minute: minute)
    }
    let twelveHour = hour % 12 == 0 ? 12 : hour % 12
    return ClockReading(
      time: "\(twelveHour):\(minuteText)",
      period: hour < 12 ? "AM" : "PM",
      hour: hour,
      minute: minute
    )
  }
}

public enum DateLineFormatter {
  public static func string(
    for date: Date,
    style: DateStyle,
    calendar: Calendar = .current,
    locale: Locale = .current
  ) -> String {
    switch style {
    case .dayOfYear:
      let day = calendar.ordinality(of: .day, in: .year, for: date) ?? 0
      return "Day \(day)"
    case .weekOfYear:
      return "Week \(calendar.component(.weekOfYear, from: date))"
    case .iso:
      let parts = calendar.dateComponents([.year, .month, .day], from: date)
      return String(format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
    default:
      let formatter = DateFormatter()
      formatter.calendar = calendar
      formatter.timeZone = calendar.timeZone
      formatter.locale = locale
      formatter.setLocalizedDateFormatFromTemplate(template(for: style))
      return formatter.string(from: date)
    }
  }

  private static func template(for style: DateStyle) -> String {
    switch style {
    case .weekdayMonthDay: "EEEEMMMMd"
    case .weekday: "EEEE"
    case .monthDay: "MMMMd"
    case .shortWeekdayDay: "EEEd"
    case .numeric: "yMd"
    case .monthYear: "MMMMy"
    case .iso, .dayOfYear, .weekOfYear: "yMd"
    }
  }
}

public struct CountdownValue: Hashable, Sendable {
  public var kind: CountdownKind
  public var remaining: Int
  /// 0...1, for progress bars and dot grids.
  public var fractionElapsed: Double
  public var label: String
}

public enum Countdown {
  public static func value(
    _ kind: CountdownKind,
    at now: Date,
    preferences: Preferences,
    calendar: Calendar = .current,
    locale: Locale = .current
  ) -> CountdownValue? {
    switch kind {
    case .day:
      guard let interval = calendar.dateInterval(of: .day, for: now) else { return nil }
      let minutesLeft = Int(interval.end.timeIntervalSince(now) / 60)
      return CountdownValue(
        kind: kind,
        remaining: minutesLeft,
        fractionElapsed: fraction(now, in: interval),
        label: "\(minutesLeft / 60)h \(minutesLeft % 60)m left today"
      )
    case .month:
      guard let interval = calendar.dateInterval(of: .month, for: now) else { return nil }
      let days = daysLeft(now, until: interval.end, calendar: calendar)
      let formatter = DateFormatter()
      formatter.calendar = calendar
      formatter.timeZone = calendar.timeZone
      formatter.locale = locale
      formatter.setLocalizedDateFormatFromTemplate("MMMM")
      let month = formatter.string(from: now)
      return CountdownValue(
        kind: kind,
        remaining: days,
        fractionElapsed: fraction(now, in: interval),
        label: "\(days) \(days == 1 ? "day" : "days") left in \(month)"
      )
    case .year:
      guard let interval = calendar.dateInterval(of: .year, for: now) else { return nil }
      let days = daysLeft(now, until: interval.end, calendar: calendar)
      let year = calendar.component(.year, from: now)
      return CountdownValue(
        kind: kind,
        remaining: days,
        fractionElapsed: fraction(now, in: interval),
        label: "\(days) \(days == 1 ? "day" : "days") left in \(year)"
      )
    case .life:
      guard
        let birthYear = preferences.birthYear,
        let birth = calendar.date(from: DateComponents(year: birthYear, month: 1, day: 1)),
        let end = calendar.date(byAdding: .year, value: preferences.lifeExpectancyYears, to: birth),
        end > birth
      else { return nil }
      let weeks = max(0, Int(end.timeIntervalSince(now) / (7 * 24 * 60 * 60)))
      let formatted = NumberFormatter.localizedString(from: NSNumber(value: weeks), number: .decimal)
      return CountdownValue(
        kind: kind,
        remaining: weeks,
        fractionElapsed: fraction(now, in: DateInterval(start: birth, end: end)),
        label: "\(formatted) \(weeks == 1 ? "week" : "weeks") left"
      )
    }
  }

  /// Counts today as a remaining day, so the last day of the year reads "1 day left".
  private static func daysLeft(_ now: Date, until end: Date, calendar: Calendar) -> Int {
    let start = calendar.startOfDay(for: now)
    return calendar.dateComponents([.day], from: start, to: end).day ?? 0
  }

  private static func fraction(_ now: Date, in interval: DateInterval) -> Double {
    guard interval.duration > 0 else { return 0 }
    return min(1, max(0, now.timeIntervalSince(interval.start) / interval.duration))
  }
}
