import Foundation

public enum AppGroup {
  public static let identifier = "group.com.novembersierra.plaintext"
}

public struct PendingLaunch: Codable, Hashable, Sendable {
  public var appName: String
  public var stagedAt: Date

  public init(appName: String, stagedAt: Date) {
    self.appName = appName
    self.stagedAt = stagedAt
  }
}

public struct Coordinate: Codable, Hashable, Sendable {
  public var latitude: Double
  public var longitude: Double

  public init(latitude: Double, longitude: Double) {
    self.latitude = latitude
    self.longitude = longitude
  }
}

/// Device state shared between the app, the widgets, and the App Intents the prebuilt shortcuts call.
public struct SharedState: Codable, Hashable, Sendable {
  public var isPro: Bool = false
  public var assistantLastCheckIn: Date?
  public var phoneShortcutInstalled: Bool = false
  public var pendingLaunch: PendingLaunch?
  public var onboarding = OnboardingProgress()
  public var lastKnownLocation: Coordinate?
  public var weather: WeatherSnapshot?
  public var remoteCatalog: AppCatalog?

  public init() {}

  public var capabilities: LaunchCapabilities {
    LaunchCapabilities(
      assistantReady: assistantLastCheckIn != nil,
      phoneShortcutInstalled: phoneShortcutInstalled
    )
  }
}

/// JSON files in the App Group container. Writes are atomic so a widget never reads a half-written file.
public final class SharedStore: @unchecked Sendable {
  private let directory: URL
  private let lock = NSLock()
  private let encoder: JSONEncoder = {
    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .iso8601
    encoder.outputFormatting = [.sortedKeys]
    return encoder
  }()
  private let decoder: JSONDecoder = {
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    return decoder
  }()

  public init(directory: URL) {
    self.directory = directory
    try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
  }

  #if canImport(Darwin)
    public static func appGroup() -> SharedStore {
      let container =
        FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: AppGroup.identifier)
        ?? FileManager.default.temporaryDirectory
      return SharedStore(directory: container.appendingPathComponent("Plaintext", isDirectory: true))
    }
  #endif

  public var configuration: Configuration {
    get { read("configuration.json") ?? .empty }
    set { write(newValue, to: "configuration.json") }
  }

  public var state: SharedState {
    get { read("state.json") ?? SharedState() }
    set { write(newValue, to: "state.json") }
  }

  public func updateConfiguration(_ change: (inout Configuration) -> Void) {
    lock.withLock {
      var value: Configuration = read("configuration.json") ?? .empty
      change(&value)
      write(value, to: "configuration.json")
    }
  }

  public func updateState(_ change: (inout SharedState) -> Void) {
    lock.withLock {
      var value: SharedState = read("state.json") ?? SharedState()
      change(&value)
      write(value, to: "state.json")
    }
  }

  public var catalog: AppCatalog {
    AppCatalog.bundled().merged(withRemote: state.remoteCatalog)
  }

  public var router: LaunchRouter {
    LaunchRouter(catalog: catalog, capabilities: state.capabilities)
  }

  // MARK: Assistant handoff

  /// A staged launch older than this is ignored, so opening Plaintext later never replays a stale tap.
  public static let handoffWindow: TimeInterval = 15

  public func stageLaunch(appName: String, now: Date = Date()) {
    updateState { $0.pendingLaunch = PendingLaunch(appName: appName, stagedAt: now) }
  }

  /// Called by the Assistant shortcut every time Plaintext opens. Also records that the automation works.
  public func consumePendingLaunch(now: Date = Date()) -> String? {
    var appName: String?
    updateState { state in
      state.assistantLastCheckIn = now
      if let pending = state.pendingLaunch, now.timeIntervalSince(pending.stagedAt) <= Self.handoffWindow,
        pending.stagedAt <= now
      {
        appName = pending.appName
      }
      state.pendingLaunch = nil
    }
    return appName
  }

  private func read<Value: Decodable>(_ name: String) -> Value? {
    guard let data = try? Data(contentsOf: directory.appendingPathComponent(name)) else { return nil }
    return try? decoder.decode(Value.self, from: data)
  }

  private func write<Value: Encodable>(_ value: Value, to name: String) {
    guard let data = try? encoder.encode(value) else { return }
    try? data.write(to: directory.appendingPathComponent(name), options: .atomic)
  }
}
