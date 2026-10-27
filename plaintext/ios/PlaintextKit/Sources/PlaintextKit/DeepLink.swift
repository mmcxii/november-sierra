import Foundation

/// URLs that open Plaintext itself, from widgets, the prebuilt shortcuts, or onboarding.
public enum DeepLink: Hashable, Sendable {
  public static let scheme = "plaintext"

  /// Widget tap for an app that needs the Assistant; the automation picks up the staged launch.
  case handoff
  /// Widget tap that needs setup before it can work.
  case setup(SetupRequirement)
  /// Sent by the "Plaintext Add Shortcut" tool with the name of a shortcut the user picked.
  case addShortcut(name: String)
  case settings

  public var url: URL {
    var components = URLComponents()
    components.scheme = Self.scheme
    switch self {
    case .handoff:
      components.host = "handoff"
    case .setup(let requirement):
      components.host = "setup"
      components.queryItems = [URLQueryItem(name: "need", value: requirement.rawValue)]
    case .addShortcut(let name):
      components.host = "add-shortcut"
      components.queryItems = [URLQueryItem(name: "name", value: name)]
    case .settings:
      components.host = "settings"
    }
    return components.requiredURL
  }

  public init?(url: URL) {
    guard
      url.scheme == Self.scheme,
      let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
    else { return nil }
    func query(_ name: String) -> String? {
      components.queryItems?.first { $0.name == name }?.value
    }
    switch components.host {
    case "handoff":
      self = .handoff
    case "setup":
      guard let need = query("need").flatMap(SetupRequirement.init(rawValue:)) else { return nil }
      self = .setup(need)
    case "add-shortcut":
      guard let name = query("name"), !name.isEmpty else { return nil }
      self = .addShortcut(name: name)
    case "settings":
      self = .settings
    default:
      return nil
    }
  }
}
