import Foundation

public struct CatalogApp: Codable, Hashable, Identifiable, Sendable {
  public enum Launch: String, Codable, Sendable {
    /// Opens straight from the widget through its URL.
    case direct
    /// Has no public URL, so it must go through the Assistant automation.
    case assistant
    /// Apple blocks third parties from opening Phone; it needs its own shortcut.
    case phoneShortcut
  }

  public var id: String
  public var name: String
  public var aliases: [String]
  public var url: URL?
  public var category: String
  public var launch: Launch

  public init(id: String, name: String, aliases: [String] = [], url: URL?, category: String, launch: Launch) {
    self.id = id
    self.name = name
    self.aliases = aliases
    self.url = url
    self.category = category
    self.launch = launch
  }
}

public struct AppCatalog: Codable, Hashable, Sendable {
  public var version: Int
  public var apps: [CatalogApp]

  public init(version: Int, apps: [CatalogApp]) {
    self.version = version
    self.apps = apps
  }

  public static func decode(_ data: Data) throws -> AppCatalog {
    try JSONDecoder().decode(AppCatalog.self, from: data)
  }

  public static func bundled() -> AppCatalog {
    guard
      let url = Bundle.module.url(forResource: "catalog", withExtension: "json"),
      let data = try? Data(contentsOf: url),
      let catalog = try? decode(data)
    else {
      return AppCatalog(version: 0, apps: [])
    }
    return catalog
  }

  /// Prefers whichever catalog is newer, so a remote fix never regresses below what shipped in the binary.
  public func merged(withRemote remote: AppCatalog?) -> AppCatalog {
    guard let remote, remote.version > version, !remote.apps.isEmpty else { return self }
    return remote
  }

  public func app(id: String) -> CatalogApp? {
    apps.first { $0.id == id }
  }

  public func search(_ query: String) -> [CatalogApp] {
    let needle = Self.normalize(query)
    guard !needle.isEmpty else {
      return apps.sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }
    return
      apps
      .compactMap { app -> (CatalogApp, Int)? in
        let nameScore = Self.score(Self.normalize(app.name), needle) * 2
        let aliasScore = app.aliases.map { Self.score(Self.normalize($0), needle) * 2 - 1 }.max() ?? 0
        let score = max(nameScore, aliasScore)
        return score > 0 ? (app, score) : nil
      }
      .sorted { lhs, rhs in
        lhs.1 != rhs.1 ? lhs.1 > rhs.1 : lhs.0.name.count < rhs.0.name.count
      }
      .map(\.0)
  }

  private static func normalize(_ text: String) -> String {
    text.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: nil)
      .trimmingCharacters(in: .whitespacesAndNewlines)
  }

  private static func score(_ candidate: String, _ needle: String) -> Int {
    if candidate == needle { return 4 }
    if candidate.hasPrefix(needle) { return 3 }
    let words = candidate.split(whereSeparator: { !$0.isLetter && !$0.isNumber })
    if words.contains(where: { $0.hasPrefix(needle) }) { return 2 }
    if candidate.contains(needle) { return 1 }
    return 0
  }
}
