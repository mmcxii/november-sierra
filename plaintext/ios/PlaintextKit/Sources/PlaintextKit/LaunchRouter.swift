import Foundation

public enum PrebuiltShortcut: String, CaseIterable, Sendable {
  case assistant = "Plaintext Assistant"
  case phone = "Plaintext Phone"
  case wallpaper = "Plaintext Wallpaper"
  case grayscale = "Plaintext Grayscale"
  case addShortcut = "Plaintext Add Shortcut"

  public var name: String { rawValue }
}

public enum ShortcutsURL {
  public static func run(_ name: String) -> URL {
    var components = URLComponents()
    components.scheme = "shortcuts"
    components.host = "run-shortcut"
    components.queryItems = [URLQueryItem(name: "name", value: name)]
    return components.requiredURL
  }

  public static let automations = URL(literal: "shortcuts://automations")
}

public struct LaunchCapabilities: Hashable, Sendable {
  public var assistantReady: Bool
  public var phoneShortcutInstalled: Bool

  public init(assistantReady: Bool, phoneShortcutInstalled: Bool) {
    self.assistantReady = assistantReady
    self.phoneShortcutInstalled = phoneShortcutInstalled
  }
}

public enum LaunchPlan: Hashable, Sendable {
  /// Opens the target without our app ever coming to the foreground.
  case direct(URL)
  /// Stages the app name, then opens Plaintext so the "When Plaintext is opened" automation can finish the job.
  case assistant(appName: String)
  /// Runs a shortcut, which briefly shows the Shortcuts app.
  case shortcut(URL)
  case needsSetup(SetupRequirement)
}

public enum SetupRequirement: String, Hashable, Identifiable, Sendable {
  case assistant
  case phoneShortcut
  case missingApp

  public var id: String { rawValue }
}

public struct LaunchRouter: Sendable {
  public var catalog: AppCatalog
  public var capabilities: LaunchCapabilities

  public init(catalog: AppCatalog, capabilities: LaunchCapabilities) {
    self.catalog = catalog
    self.capabilities = capabilities
  }

  public func plan(for target: LaunchTarget) -> LaunchPlan {
    switch target {
    case .url(let url):
      return .direct(url)
    case .shortcut(let name):
      return .shortcut(ShortcutsURL.run(name))
    case .assistant(let appName):
      return capabilities.assistantReady ? .assistant(appName: appName) : .needsSetup(.assistant)
    case .catalog(let appID):
      guard let app = catalog.app(id: appID) else { return .needsSetup(.missingApp) }
      return plan(for: app)
    }
  }

  private func plan(for app: CatalogApp) -> LaunchPlan {
    switch app.launch {
    case .direct:
      if let url = app.url { return .direct(url) }
      return assistantPlan(for: app)
    case .assistant:
      return assistantPlan(for: app)
    case .phoneShortcut:
      guard capabilities.phoneShortcutInstalled else { return .needsSetup(.phoneShortcut) }
      return .shortcut(ShortcutsURL.run(PrebuiltShortcut.phone.name))
    }
  }

  private func assistantPlan(for app: CatalogApp) -> LaunchPlan {
    capabilities.assistantReady ? .assistant(appName: app.name) : .needsSetup(.assistant)
  }
}
