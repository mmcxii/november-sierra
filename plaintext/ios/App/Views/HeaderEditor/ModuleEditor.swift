import PlaintextKit
import SwiftUI

struct ModuleEditor: View {
  // MARK: Types
  private enum Kind: String, CaseIterable, Identifiable {
    case digitalClock = "Clock"
    case analogClock = "Analog clock"
    case date = "Date"
    case weather = "Weather"
    case countdown = "Countdown"
    case quote = "Quote of the day"
    case nextEvent = "Next event"

    var id: String { rawValue }
  }

  // MARK: Inputs
  @Binding var module: HeaderModule

  // MARK: State
  @Environment(AppModel.self) private var model

  // MARK: Variables
  private var kindBinding: Binding<Kind> {
    Binding(
      get: {
        switch module {
        case .digitalClock: .digitalClock
        case .analogClock: .analogClock
        case .date: .date
        case .weather: .weather
        case .countdown: .countdown
        case .quote: .quote
        case .nextEvent: .nextEvent
        }
      },
      set: { kind in
        module =
          switch kind {
          case .digitalClock: .digitalClock
          case .analogClock: .analogClock
          case .date: .date(.weekdayMonthDay)
          case .weather: .weather(.current)
          case .countdown: .countdown(.year)
          case .quote: .quote
          case .nextEvent: .nextEvent
          }
      }
    )
  }

  // MARK: Body
  var body: some View {
    Picker("Show", selection: kindBinding) {
      ForEach(Kind.allCases) { Text($0.rawValue).tag($0) }
    }
    switch module {
    case .date(let style):
      Picker("Format", selection: Binding(get: { style }, set: { module = .date($0) })) {
        ForEach(DateStyle.allCases, id: \.self) { style in
          Text(DateLineFormatter.string(for: Date(), style: style)).tag(style)
        }
      }
    case .weather(let style):
      Picker(
        "Forecast",
        selection: Binding(
          get: { style.kind }, set: { module = .weather(WeatherStyle(kind: $0, coloredIcons: style.coloredIcons)) })
      ) {
        Text("Now").tag(WeatherStyle.Kind.current)
        Text("5 days").tag(WeatherStyle.Kind.fiveDay)
        Text("10 days").tag(WeatherStyle.Kind.tenDay)
      }
      Toggle(
        "Colored icons",
        isOn: Binding(
          get: { style.coloredIcons }, set: { module = .weather(WeatherStyle(kind: style.kind, coloredIcons: $0)) }))
    case .countdown(let kind):
      Picker("Counting down", selection: Binding(get: { kind }, set: { module = .countdown($0) })) {
        Text("Today").tag(CountdownKind.day)
        Text("This month").tag(CountdownKind.month)
        Text("This year").tag(CountdownKind.year)
        Text("Your life").tag(CountdownKind.life)
      }
      if kind == .life {
        LifeCountdownSettings()
      }
    case .nextEvent:
      CalendarAccessRow()
    case .digitalClock, .analogClock, .quote:
      EmptyView()
    }
  }
}
