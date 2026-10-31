import Foundation
import Testing

@testable import PlaintextKit

struct LaunchRouterTests {
  let catalog = AppCatalog.bundled()

  func router(assistant: Bool = false, phone: Bool = false) -> LaunchRouter {
    LaunchRouter(
      catalog: catalog,
      capabilities: LaunchCapabilities(assistantReady: assistant, phoneShortcutInstalled: phone)
    )
  }

  @Test func catalogAppWithSchemeOpensDirectly() {
    // Act
    let plan = router().plan(for: .catalog(appID: "spotify"))

    // Assert
    #expect(plan == .direct(URL(literal: "spotify://")))
  }

  @Test func appWithoutSchemeNeedsAssistantUntilItIsReady() {
    // Act
    let beforeSetup = router().plan(for: .catalog(appID: "camera"))
    let afterSetup = router(assistant: true).plan(for: .catalog(appID: "camera"))

    // Assert
    #expect(beforeSetup == .needsSetup(.assistant))
    #expect(afterSetup == .assistant(appName: "Camera"))
  }

  @Test func phoneRoutesThroughItsOwnShortcut() {
    // Act
    let beforeSetup = router().plan(for: .catalog(appID: "phone"))
    let afterSetup = router(phone: true).plan(for: .catalog(appID: "phone"))

    // Assert
    #expect(beforeSetup == .needsSetup(.phoneShortcut))
    #expect(afterSetup == .shortcut(URL(literal: "shortcuts://run-shortcut?name=Plaintext%20Phone")))
  }

  @Test func unknownCatalogIDAsksToReAddTheApp() {
    // Act
    let plan = router().plan(for: .catalog(appID: "deleted-app"))

    // Assert
    #expect(plan == .needsSetup(.missingApp))
  }

  @Test func customTargets() {
    // Arrange
    let url = URL(literal: "obsidian://open?vault=notes")

    // Act
    let customURL = router().plan(for: .url(url))
    let assistantReady = router(assistant: true).plan(for: .assistant(appName: "Halide"))
    let assistantMissing = router().plan(for: .assistant(appName: "Halide"))

    // Assert
    #expect(customURL == .direct(url))
    #expect(assistantReady == .assistant(appName: "Halide"))
    #expect(assistantMissing == .needsSetup(.assistant))
  }
}

struct CatalogTests {
  let catalog = AppCatalog.bundled()

  @Test func bundledCatalogLoadsWithUniqueIDs() {
    // Act
    let ids = Set(catalog.apps.map(\.id))
    let directApps = catalog.apps.filter { $0.launch == .direct }

    // Assert
    #expect(catalog.apps.count > 50)
    #expect(ids.count == catalog.apps.count)
    #expect(directApps.allSatisfy { $0.url != nil })
  }

  @Test func searchRanksExactAndPrefixMatchesFirst() {
    // Act
    let maps = catalog.search("maps").first?.id
    let goo = catalog.search("goo").first?.id
    let drive = catalog.search("drive").first?.id

    // Assert
    #expect(maps == "maps")
    #expect(goo == "google")
    #expect(drive == "google-drive")
  }

  @Test func searchMatchesAliasesAndIgnoresCase() {
    // Act
    let twitter = catalog.search("TWITTER").first?.id
    let iMessage = catalog.search("imessage").first?.id

    // Assert
    #expect(twitter == "x")
    #expect(iMessage == "messages")
  }

  @Test func searchWithNoMatchIsEmpty() {
    // Act
    let results = catalog.search("zzqx")

    // Assert
    #expect(results.isEmpty)
  }

  @Test func remoteCatalogOnlyWinsWhenNewer() {
    // Arrange
    let older = AppCatalog(
      version: 0,
      apps: [CatalogApp(id: "a", name: "A", url: nil, category: "", launch: .assistant)]
    )
    let newer = AppCatalog(version: catalog.version + 1, apps: older.apps)

    // Act
    let keptBundled = catalog.merged(withRemote: older)
    let tookRemote = catalog.merged(withRemote: newer)

    // Assert
    #expect(keptBundled == catalog)
    #expect(tookRemote == newer)
  }
}

struct DeepLinkTests {
  @Test func roundTrips() {
    // Arrange
    let links = [DeepLink.handoff, .setup(.assistant), .addShortcut(name: "Open Halide"), .settings]

    // Act
    let parsed = links.map { DeepLink(url: $0.url) }

    // Assert
    #expect(parsed == links)
  }

  @Test func rejectsForeignAndMalformedURLs() {
    // Act
    let foreign = DeepLink(url: URL(literal: "https://example.com"))
    let missingName = DeepLink(url: URL(literal: "plaintext://add-shortcut"))
    let unknownNeed = DeepLink(url: URL(literal: "plaintext://setup?need=nope"))

    // Assert
    #expect(foreign == nil)
    #expect(missingName == nil)
    #expect(unknownNeed == nil)
  }
}
