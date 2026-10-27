import PlaintextKit
import SwiftUI
import WidgetKit

struct NextEvent: Hashable, Sendable {
  var title: String
  var start: Date
}

/// Everything a header needs for one moment in time, so widgets and in-app previews render identically.
struct HeaderContent {
  var date: Date
  var header: HeaderConfiguration
  var preferences: Preferences
  var theme: Theme
  var weather: WeatherSnapshot?
  var quote: Quote?
  var nextEvent: NextEvent?
}
