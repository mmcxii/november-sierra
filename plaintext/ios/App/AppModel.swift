import Foundation
import Observation
import PlaintextKit
import SwiftUI
import WidgetKit

@MainActor
@Observable
final class AppModel {
  let store: SharedStore
  private(set) var configuration: Configuration
  private(set) var state: SharedState
  private(set) var catalog: AppCatalog
  var pendingSetup: SetupRequirement?
  var isShowingHandoff = false
  var isShowingPaywall = false

  init(store: SharedStore = .appGroup()) {
    self.store = store
    configuration = store.configuration
    state = store.state
    catalog = store.catalog
  }

  var entitlements: Entitlements { Entitlements(isPro: state.isPro) }
  var router: LaunchRouter { LaunchRouter(catalog: catalog, capabilities: state.capabilities) }

  var onboardingSteps: [OnboardingStep] {
    OnboardingPlan.steps(configuration: configuration, router: router)
  }

  var systemMajorVersion: Int {
    ProcessInfo.processInfo.operatingSystemVersion.majorVersion
  }

  // MARK: Editing

  func updateConfiguration(_ change: (inout Configuration) -> Void) {
    store.updateConfiguration(change)
    configuration = store.configuration
    WidgetCenter.shared.reloadAllTimelines()
  }

  func updateState(_ change: (inout SharedState) -> Void) {
    store.updateState(change)
    state = store.state
  }

  func reload() {
    configuration = store.configuration
    state = store.state
  }

  @discardableResult
  func add(_ target: LaunchTarget, label: String, toPage pageID: UUID? = nil) -> Bool {
    guard let index = pageIndex(pageID) else { return false }
    guard entitlements.canAddItem(currentCount: configuration.pages[index].items.count) else {
      isShowingPaywall = true
      return false
    }
    updateConfiguration { $0.pages[index].items.append(LauncherItem(label: label, target: target)) }
    return true
  }

  func add(_ app: CatalogApp, toPage pageID: UUID? = nil) {
    add(.catalog(appID: app.id), label: app.name, toPage: pageID)
  }

  func rename(_ itemID: UUID, to label: String) {
    let trimmed = label.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return }
    updateConfiguration { configuration in
      for page in configuration.pages.indices {
        if let item = configuration.pages[page].items.firstIndex(where: { $0.id == itemID }) {
          configuration.pages[page].items[item].label = trimmed
        }
      }
    }
  }

  func removeItems(at offsets: IndexSet, fromPage pageID: UUID) {
    guard let index = pageIndex(pageID) else { return }
    updateConfiguration { $0.pages[index].items.remove(atOffsets: offsets) }
  }

  func moveItems(from source: IndexSet, to destination: Int, inPage pageID: UUID) {
    guard let index = pageIndex(pageID) else { return }
    updateConfiguration { $0.pages[index].items.move(fromOffsets: source, toOffset: destination) }
  }

  @discardableResult
  func addPage(named name: String) -> UUID? {
    guard entitlements.canAddPage(currentCount: configuration.pages.count) else {
      isShowingPaywall = true
      return nil
    }
    let page = LauncherPage(name: name)
    updateConfiguration { $0.pages.append(page) }
    return page.id
  }

  func removePage(_ pageID: UUID) {
    updateConfiguration { $0.pages.removeAll { $0.id == pageID } }
  }

  func renamePage(_ pageID: UUID, to name: String) {
    let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return }
    updateConfiguration { configuration in
      guard let index = configuration.pages.firstIndex(where: { $0.id == pageID }) else { return }
      configuration.pages[index].name = trimmed
    }
  }

  @discardableResult
  func addHeader(named name: String) -> UUID? {
    guard entitlements.canAddHeader(currentCount: configuration.headers.count) else {
      isShowingPaywall = true
      return nil
    }
    let header = HeaderLayout(name: name)
    updateConfiguration { $0.headers.append(header) }
    return header.id
  }

  func removeHeader(_ headerID: UUID) {
    updateConfiguration { $0.headers.removeAll { $0.id == headerID } }
  }

  func renameHeader(_ headerID: UUID, to name: String) {
    let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return }
    updateConfiguration { configuration in
      guard let index = configuration.headers.firstIndex(where: { $0.id == headerID }) else { return }
      configuration.headers[index].name = trimmed
    }
  }

  func updateHeader(_ headerID: UUID, _ change: (inout HeaderLayout) -> Void) {
    updateConfiguration { configuration in
      guard let index = configuration.headers.firstIndex(where: { $0.id == headerID }) else { return }
      change(&configuration.headers[index])
    }
  }

  private func pageIndex(_ pageID: UUID?) -> Int? {
    guard let pageID else { return configuration.pages.indices.first }
    return configuration.pages.firstIndex { $0.id == pageID }
  }

  // MARK: Onboarding

  func complete(_ step: OnboardingStep) {
    updateState { state in
      state.onboarding.completed.insert(step)
      if step == .finish { state.onboarding.isFinished = true }
    }
  }

  func restartOnboarding() {
    updateState { $0.onboarding = OnboardingProgress() }
  }

  // MARK: Deep links

  func handle(_ url: URL) {
    guard let link = DeepLink(url: url) else { return }
    switch link {
    case .handoff:
      // The "When Plaintext is opened" automation is already running and will open the staged app.
      isShowingHandoff = true
      Task {
        try? await Task.sleep(for: .seconds(3))
        isShowingHandoff = false
      }
    case .setup(let requirement):
      pendingSetup = requirement
    case .addShortcut(let name):
      add(.shortcut(name: name), label: name)
    case .settings:
      break
    }
  }

  // MARK: Catalog

  func refreshRemoteCatalog() async {
    guard let response = try? await URLSession.shared.data(from: PlaintextService.catalogURL),
      let remote = try? AppCatalog.decode(response.0)
    else { return }
    updateState { $0.remoteCatalog = remote }
    catalog = store.catalog
  }
}
