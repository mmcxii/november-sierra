import Foundation

public struct Quote: Codable, Hashable, Sendable {
  public var text: String
  public var author: String

  public init(text: String, author: String) {
    self.text = text
    self.author = author
  }
}

public enum QuoteOfTheDay {
  public static func bundled() -> [Quote] {
    guard
      let url = Bundle.module.url(forResource: "quotes", withExtension: "json"),
      let data = try? Data(contentsOf: url),
      let quotes = try? JSONDecoder().decode([Quote].self, from: data)
    else { return [] }
    return quotes
  }

  /// Stable for a whole local day, so every widget on the device agrees on today's quote.
  public static func quote(for date: Date, from quotes: [Quote], calendar: Calendar = .current) -> Quote? {
    guard !quotes.isEmpty else { return nil }
    let start = calendar.startOfDay(for: date)
    let dayNumber = Int((start.timeIntervalSince1970 + Double(calendar.timeZone.secondsFromGMT(for: start))) / 86_400)
    let index = ((dayNumber % quotes.count) + quotes.count) % quotes.count
    return quotes[index]
  }
}
