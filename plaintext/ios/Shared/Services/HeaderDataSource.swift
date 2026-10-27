import CoreLocation
import EventKit
import Foundation
import PlaintextKit
import WeatherKit

/// Fetches the live data headers show. Called from widget timelines and from the app when it comes to the foreground.
enum HeaderDataSource {
  static func content(
    at date: Date,
    header: HeaderConfiguration,
    preferences: Preferences,
    theme: Theme,
    store: SharedStore
  ) async -> HeaderContent {
    let modules = header.visibleModules
    let needsWeather = modules.contains { if case .weather = $0 { true } else { false } }
    var weather: WeatherSnapshot?
    if needsWeather {
      weather = await refreshWeather(store: store, preferences: preferences)
    }
    let quote =
      modules.contains(.quote) ? QuoteOfTheDay.quote(for: date, from: QuoteOfTheDay.bundled()) : nil
    let nextEvent = modules.contains(.nextEvent) ? nextCalendarEvent(after: date) : nil
    return HeaderContent(
      date: date,
      header: header,
      preferences: preferences,
      theme: theme,
      weather: weather,
      quote: quote,
      nextEvent: nextEvent
    )
  }

  static func refreshWeather(store: SharedStore, preferences: Preferences) async -> WeatherSnapshot? {
    let state = store.state
    if let cached = state.weather, !cached.isStale(now: Date()) { return cached }
    guard let coordinate = coordinate(for: preferences.weatherLocation, state: state) else { return state.weather }
    do {
      let location = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
      let (current, daily) = try await WeatherService.shared.weather(for: location, including: .current, .daily)
      let snapshot = WeatherSnapshot(
        fetchedAt: Date(),
        temperatureCelsius: current.temperature.converted(to: .celsius).value,
        conditionDescription: current.condition.description.lowercased(),
        symbolName: current.symbolName,
        daily: daily.forecast.prefix(10).map { day in
          WeatherSnapshot.Day(
            date: day.date,
            highCelsius: day.highTemperature.converted(to: .celsius).value,
            lowCelsius: day.lowTemperature.converted(to: .celsius).value,
            symbolName: day.symbolName
          )
        }
      )
      store.updateState { $0.weather = snapshot }
      return snapshot
    } catch {
      return state.weather
    }
  }

  private static func coordinate(for location: Preferences.WeatherLocation, state: SharedState) -> Coordinate? {
    switch location {
    case .fixed(_, let latitude, let longitude):
      return Coordinate(latitude: latitude, longitude: longitude)
    case .current:
      // The widget extension declares NSWidgetWantsLocation, so this is the system's cached fix, not a new request.
      if let fix = CLLocationManager().location?.coordinate {
        return Coordinate(latitude: fix.latitude, longitude: fix.longitude)
      }
      return state.lastKnownLocation
    }
  }

  static func nextCalendarEvent(after date: Date) -> NextEvent? {
    guard EKEventStore.authorizationStatus(for: .event) == .fullAccess else { return nil }
    let store = EKEventStore()
    guard let end = Calendar.current.date(byAdding: .hour, value: 24, to: date) else { return nil }
    let predicate = store.predicateForEvents(withStart: date, end: end, calendars: nil)
    return store.events(matching: predicate)
      .filter { !$0.isAllDay && $0.endDate > date }
      .min { $0.startDate < $1.startDate }
      .map { NextEvent(title: $0.title ?? "", start: $0.startDate) }
  }
}
