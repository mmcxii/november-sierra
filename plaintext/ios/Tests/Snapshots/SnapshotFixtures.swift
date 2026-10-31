import Foundation
import PlaintextKit

/// Fixed inputs so every run renders the same clock, weather, and apps.
enum SnapshotFixtures {
  static let date: Date = {
    let components = DateComponents(
      calendar: Calendar(identifier: .gregorian),
      year: 2026,
      month: 10,
      day: 27,
      hour: 9,
      minute: 41
    )
    return components.date ?? Date(timeIntervalSince1970: 0)
  }()

  /// "notes" is a renamed Obsidian, the kind of label a person types themselves.
  static let page = LauncherPage(
    name: "Home",
    items: [
      ("Phone", "phone"),
      ("Messages", "messages"),
      ("Camera", "camera"),
      ("Maps", "maps"),
      ("Music", "music"),
      ("notes", "obsidian"),
      ("Calendar", "calendar"),
      ("Mail", "mail"),
    ].map { LauncherItem(label: $0.0, target: .catalog(appID: $0.1)) }
  )

  static let weather = WeatherSnapshot(
    fetchedAt: date,
    temperatureCelsius: 17,
    conditionDescription: "Partly Cloudy",
    symbolName: "cloud.sun",
    daily: (0..<10).map { day in
      WeatherSnapshot.Day(
        date: date.addingTimeInterval(Double(day) * 86_400),
        highCelsius: 18 + Double(day % 3),
        lowCelsius: 9 + Double(day % 2),
        symbolName: ["sun.max", "cloud.sun", "cloud.rain"][day % 3]
      )
    }
  )

  static let quote = Quote(text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci")

  static let nextEvent = NextEvent(title: "Dentist", start: date.addingTimeInterval(2 * 3_600))
}
