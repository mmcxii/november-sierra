import Foundation
import Testing

@testable import PlaintextKit

struct FormattingTests {
  let calendar: Calendar = {
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = TimeZone(identifier: "America/Los_Angeles") ?? .gmt
    return calendar
  }()
  let us = Locale(identifier: "en_US")
  let uk = Locale(identifier: "en_GB")

  func date(_ year: Int, _ month: Int, _ day: Int, _ hour: Int = 12, _ minute: Int = 0) throws -> Date {
    try #require(calendar.date(from: DateComponents(year: year, month: month, day: day, hour: hour, minute: minute)))
  }

  @Test func clockHonorsExplicitPreference() throws {
    // Arrange
    let afternoon = try date(2026, 10, 27, 15, 4)

    // Act
    let twelve = ClockFormatter.reading(at: afternoon, format: .twelveHour, calendar: calendar, locale: uk)
    let twentyFour = ClockFormatter.reading(at: afternoon, format: .twentyFourHour, calendar: calendar, locale: us)

    // Assert
    #expect(twelve.time == "3:04")
    #expect(twelve.period == "PM")
    #expect(twentyFour.time == "15:04")
    #expect(twentyFour.period == nil)
  }

  @Test func clockFollowsLocaleWhenSetToSystem() {
    // Act
    let usUsesTwentyFour = ClockFormatter.usesTwentyFourHour(.system, locale: us)
    let ukUsesTwentyFour = ClockFormatter.usesTwentyFourHour(.system, locale: uk)

    // Assert
    #expect(!usUsesTwentyFour)
    #expect(ukUsesTwentyFour)
  }

  @Test func midnightAndNoonInTwelveHour() throws {
    // Arrange
    let midnight = try date(2026, 1, 1, 0, 5)
    let noon = try date(2026, 1, 1, 12, 0)

    // Act
    let midnightReading = ClockFormatter.reading(at: midnight, format: .twelveHour, calendar: calendar)
    let noonReading = ClockFormatter.reading(at: noon, format: .twelveHour, calendar: calendar)

    // Assert
    #expect(midnightReading.time == "12:05")
    #expect(noonReading.period == "PM")
  }

  @Test func dateStyles() throws {
    // Arrange
    let day = try date(2026, 10, 27)

    // Act
    let lines = [DateStyle.weekdayMonthDay, .weekday, .iso, .dayOfYear].map { style in
      DateLineFormatter.string(for: day, style: style, calendar: calendar, locale: us)
    }

    // Assert
    #expect(lines == ["Tuesday, October 27", "Tuesday", "2026-10-27", "Day 300"])
  }

  @Test func temperatureUnits() {
    // Act
    let fahrenheit = TemperatureFormatter.format(celsius: 18, preference: .fahrenheit)
    let celsius = TemperatureFormatter.format(celsius: 18, preference: .celsius)
    let systemUS = TemperatureFormatter.format(celsius: 18, preference: .system, locale: us)
    let systemUK = TemperatureFormatter.format(celsius: 18, preference: .system, locale: uk)

    // Assert
    #expect(fahrenheit == "64°")
    #expect(celsius == "18°")
    #expect(systemUS == "64°")
    #expect(systemUK == "18°")
  }

  @Test func countdowns() throws {
    // Arrange
    let now = try date(2026, 12, 31, 21, 30)
    let preferences = Preferences(birthYear: 1990, lifeExpectancyYears: 80)

    // Act
    let day = Countdown.value(.day, at: now, preferences: preferences, calendar: calendar)
    let month = Countdown.value(.month, at: now, preferences: preferences, calendar: calendar, locale: us)
    let year = Countdown.value(.year, at: now, preferences: preferences, calendar: calendar)
    let life = try #require(Countdown.value(.life, at: now, preferences: preferences, calendar: calendar))
    let lifeWithoutBirthYear = Countdown.value(.life, at: now, preferences: Preferences(), calendar: calendar)

    // Assert
    #expect(day?.label == "2h 30m left today")
    #expect(month?.label == "1 day left in December")
    #expect(year?.remaining == 1)
    #expect(life.fractionElapsed > 0.46 && life.fractionElapsed < 0.47)
    #expect(lifeWithoutBirthYear == nil)
  }

  @Test func quoteOfTheDayIsStableWithinADayAndChangesNextDay() throws {
    // Arrange
    let quotes = QuoteOfTheDay.bundled()

    // Act
    let morning = QuoteOfTheDay.quote(for: try date(2026, 10, 27, 7), from: quotes, calendar: calendar)
    let night = QuoteOfTheDay.quote(for: try date(2026, 10, 27, 23), from: quotes, calendar: calendar)
    let tomorrow = QuoteOfTheDay.quote(for: try date(2026, 10, 28, 7), from: quotes, calendar: calendar)

    // Assert
    #expect(quotes.count > 20)
    #expect(morning == night)
    #expect(morning != tomorrow)
  }

  @Test func missedSearchPolicy() {
    // Act
    let newMiss = MissedSearch.shouldReport(query: " Halide ", resultCount: 0, alreadyReported: [])
    let repeatMiss = MissedSearch.shouldReport(query: "halide", resultCount: 0, alreadyReported: ["halide"])
    let tooShort = MissedSearch.shouldReport(query: "ha", resultCount: 0, alreadyReported: [])
    let found = MissedSearch.shouldReport(query: "halide", resultCount: 1, alreadyReported: [])

    // Assert
    #expect(newMiss)
    #expect(!repeatMiss)
    #expect(!tooShort)
    #expect(!found)
  }
}
