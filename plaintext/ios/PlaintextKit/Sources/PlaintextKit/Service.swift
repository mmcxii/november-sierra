import Foundation

public enum PlaintextService {
  public static let catalogURL = URL(literal: "https://novembersierra.dev/plaintext/catalog.json")
  public static let missedSearchURL = URL(literal: "https://novembersierra.dev/api/plaintext/missed-search")
  public static let helpURL = URL(literal: "https://novembersierra.dev/plaintext/help")
}

/// The only data Plaintext sends off the device: the text of a catalog search that found nothing.
public struct MissedSearch: Codable, Hashable, Sendable {
  public var query: String
  public var appVersion: String

  public init(query: String, appVersion: String) {
    self.query = query
    self.appVersion = appVersion
  }

  public static func normalized(_ query: String) -> String {
    query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
  }

  /// Reports a query once per install, and only when it looks like an app name rather than half-typed input.
  public static func shouldReport(query: String, resultCount: Int, alreadyReported: Set<String>) -> Bool {
    let normalized = normalized(query)
    return resultCount == 0 && normalized.count >= 3 && normalized.count <= 40
      && !alreadyReported.contains(normalized)
  }
}
