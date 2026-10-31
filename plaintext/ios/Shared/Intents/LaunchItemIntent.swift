import AppIntents
import Foundation
import PlaintextKit

/// Runs inside the widget extension when a row is tapped. Returning an `OpenURLIntent` hands the URL straight to
/// the system, so apps with a known URL open without Plaintext ever coming to the foreground.
struct LaunchItemIntent: AppIntent {
  static let title: LocalizedStringResource = "Open Launcher Item"
  static let isDiscoverable = false

  @Parameter(title: "Item")
  var itemID: String

  init() {}

  init(itemID: UUID) {
    self.itemID = itemID.uuidString
  }

  func perform() async throws -> some IntentResult & OpensIntent {
    let store = SharedStore.appGroup()
    guard let item = store.configuration.pages.flatMap(\.items).first(where: { $0.id.uuidString == itemID }) else {
      return .result(opensIntent: OpenURLIntent(DeepLink.settings.url))
    }
    switch store.router.plan(for: item.target) {
    case .direct(let url), .shortcut(let url):
      return .result(opensIntent: OpenURLIntent(url))
    case .assistant(let appName):
      store.stageLaunch(appName: appName)
      return .result(opensIntent: OpenURLIntent(DeepLink.handoff.url))
    case .needsSetup(let requirement):
      return .result(opensIntent: OpenURLIntent(DeepLink.setup(requirement).url))
    }
  }
}
