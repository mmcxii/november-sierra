import Foundation

/// One entry per minute keeps the clock exact without spending the reload budget; WidgetKit renders
/// pre-computed entries for free and only calls back into the extension when the hour runs out.
enum MinuteTimeline {
  static func dates(from now: Date, count: Int = 60) -> [Date] {
    let start = Calendar.current.dateInterval(of: .minute, for: now)?.start ?? now
    return (0..<count).compactMap { Calendar.current.date(byAdding: .minute, value: $0, to: start) }
  }
}
