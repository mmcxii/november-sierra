import Foundation

public struct LauncherItem: Codable, Hashable, Identifiable, Sendable {
  public var id: UUID
  public var label: String
  public var target: LaunchTarget

  public init(id: UUID = UUID(), label: String, target: LaunchTarget) {
    self.id = id
    self.label = label
    self.target = target
  }
}

public enum LaunchTarget: Codable, Hashable, Sendable {
  /// An app from the bundled or remote catalog, resolved at launch time so catalog fixes apply retroactively.
  case catalog(appID: String)
  /// A user-supplied URL scheme or universal link.
  case url(URL)
  /// A user-made shortcut, run through the Shortcuts app.
  case shortcut(name: String)
  /// Any installed app, opened by its exact home screen name through the Assistant automation.
  case assistant(appName: String)
}

public struct LauncherPage: Codable, Hashable, Identifiable, Sendable {
  public var id: UUID
  public var name: String
  public var items: [LauncherItem]

  public init(id: UUID = UUID(), name: String, items: [LauncherItem] = []) {
    self.id = id
    self.name = name
    self.items = items
  }
}

/// A named header layout. Widgets choose one of these, or none, independently of the page they show.
public struct HeaderLayout: Codable, Hashable, Identifiable, Sendable {
  public var id: UUID
  public var name: String
  public var configuration: HeaderConfiguration

  public init(id: UUID = UUID(), name: String, configuration: HeaderConfiguration = .default) {
    self.id = id
    self.name = name
    self.configuration = configuration
  }
}

public struct Configuration: Codable, Hashable, Sendable {
  public static let currentVersion = 1

  public var version: Int
  public var pages: [LauncherPage]
  public var headers: [HeaderLayout]
  public var preferences: Preferences
  public var theme: Theme

  public init(
    version: Int = Configuration.currentVersion,
    pages: [LauncherPage],
    headers: [HeaderLayout]? = nil,
    header: HeaderConfiguration = .default,
    preferences: Preferences = .default,
    theme: Theme = .default
  ) {
    self.version = version
    self.pages = pages
    self.headers = headers ?? [HeaderLayout(name: "Header", configuration: header)]
    self.preferences = preferences
    self.theme = theme
  }

  public static let empty = Configuration(pages: [LauncherPage(name: "Home")])

  public func page(id: UUID?) -> LauncherPage? {
    guard let id else { return pages.first }
    return pages.first { $0.id == id }
  }

  private enum CodingKeys: String, CodingKey {
    case version, pages, headers, preferences, theme
  }

  private enum LegacyCodingKeys: String, CodingKey {
    case header
  }

  /// A saved file from before headers were a list stores one `header`. An explicit empty list stays empty.
  public init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    let legacy = try decoder.container(keyedBy: LegacyCodingKeys.self)
    version = try container.decodeIfPresent(Int.self, forKey: .version) ?? Self.currentVersion
    pages = try container.decodeIfPresent([LauncherPage].self, forKey: .pages) ?? []
    preferences = try container.decodeIfPresent(Preferences.self, forKey: .preferences) ?? .default
    theme = try container.decodeIfPresent(Theme.self, forKey: .theme) ?? .default
    if let headers = try container.decodeIfPresent([HeaderLayout].self, forKey: .headers) {
      self.headers = headers
    } else if let header = try legacy.decodeIfPresent(HeaderConfiguration.self, forKey: .header) {
      headers = [HeaderLayout(name: "Header", configuration: header)]
    } else {
      headers = [HeaderLayout(name: "Header")]
    }
  }

  public func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(version, forKey: .version)
    try container.encode(pages, forKey: .pages)
    try container.encode(headers, forKey: .headers)
    try container.encode(preferences, forKey: .preferences)
    try container.encode(theme, forKey: .theme)
  }
}
