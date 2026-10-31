import Foundation
import Testing

@testable import PlaintextKit

func temporaryStore() -> SharedStore {
  SharedStore(directory: FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString))
}

struct StoreTests {
  let store = temporaryStore()

  @Test func configurationPersistsAcrossInstances() {
    // Arrange
    let item = LauncherItem(label: "music", target: .catalog(appID: "spotify"))

    // Act
    store.updateConfiguration { $0.pages[0].items = [item] }

    // Assert
    #expect(store.configuration.pages[0].items == [item])
  }

  @Test func freshStoreHasOneEmptyPage() {
    // Act
    let configuration = store.configuration
    let state = store.state

    // Assert
    #expect(configuration.pages.count == 1)
    #expect(configuration.pages.first?.name == "Home")
    #expect(configuration.headers.count == 1)
    #expect(configuration.headers.first?.name == "Header")
    #expect(state.capabilities == LaunchCapabilities(assistantReady: false, phoneShortcutInstalled: false))
  }

  @Test func handoffIsConsumedOnceAndMarksAssistantReady() {
    // Arrange
    let now = Date()
    store.stageLaunch(appName: "Camera", now: now)

    // Act
    let first = store.consumePendingLaunch(now: now.addingTimeInterval(2))
    let second = store.consumePendingLaunch(now: now.addingTimeInterval(3))

    // Assert
    #expect(first == "Camera")
    #expect(second == nil)
    #expect(store.state.capabilities.assistantReady)
  }

  @Test func staleHandoffIsIgnored() {
    // Arrange
    let now = Date()
    store.stageLaunch(appName: "Camera", now: now)

    // Act
    let launch = store.consumePendingLaunch(now: now.addingTimeInterval(SharedStore.handoffWindow + 1))

    // Assert
    #expect(launch == nil)
  }
}

struct EntitlementTests {
  let free = Entitlements(isPro: false)

  @Test func freeTierLimits() {
    // Act
    let sixthItem = free.canAddItem(currentCount: 5)
    let seventhItem = free.canAddItem(currentCount: 6)
    let secondPage = free.canAddPage(currentCount: 1)
    let firstHeader = free.canAddHeader(currentCount: 0)
    let secondHeader = free.canAddHeader(currentCount: 1)
    let proItem = Entitlements(isPro: true).canAddItem(currentCount: 100)

    // Assert
    #expect(sixthItem)
    #expect(!seventhItem)
    #expect(!secondPage)
    #expect(firstHeader)
    #expect(!secondHeader)
    #expect(proItem)
  }

  @Test func freeHeaderModules() {
    // Arrange
    let freeModules: [HeaderModule] = [.digitalClock, .date(.weekdayMonthDay), .weather(.current)]
    let proModules: [HeaderModule] = [
      .analogClock, .date(.weekday), .weather(WeatherStyle(kind: .fiveDay)), .quote, .nextEvent,
    ]

    // Act
    let allowedFree = freeModules.map(free.allows)
    let allowedPro = proModules.map(free.allows)

    // Assert
    #expect(allowedFree.allSatisfy { $0 })
    #expect(allowedPro.allSatisfy { !$0 })
    #expect(free.allows(HeaderConfiguration.default))
  }

  @Test func legacyHeaderDecodesAsANamedHeader() throws {
    // Arrange
    let header = HeaderConfiguration(
      arrangement: .stacked,
      primary: .quote,
      secondary: .digitalClock,
      showsDateCaption: false,
      showsWeatherCaption: true
    )
    let headerJSON = try JSONSerialization.jsonObject(with: JSONEncoder().encode(header))
    let data = try JSONSerialization.data(withJSONObject: ["pages": [] as [Any], "header": headerJSON])

    // Act
    let configuration = try JSONDecoder().decode(Configuration.self, from: data)
    let emptied = Configuration(pages: [], headers: [])
    let roundTrip = try JSONDecoder().decode(Configuration.self, from: JSONEncoder().encode(emptied))

    // Assert
    #expect(configuration.headers.count == 1)
    #expect(configuration.headers[0].name == "Header")
    #expect(configuration.headers[0].configuration == header)
    #expect(roundTrip.headers.isEmpty)
  }

  @Test func effectiveConfigurationTrimsProFeaturesForFreeUsers() {
    // Arrange
    let items = (0..<9).map { LauncherItem(label: "\($0)", target: .catalog(appID: "maps")) }
    let configuration = Configuration(
      pages: [LauncherPage(name: "Home", items: items), LauncherPage(name: "Work")],
      header: HeaderConfiguration(
        arrangement: .stacked,
        primary: .quote,
        secondary: .digitalClock,
        showsDateCaption: false,
        showsWeatherCaption: true
      )
    )

    // Act
    let effective = free.effective(configuration)
    let pro = Entitlements(isPro: true).effective(configuration)

    // Assert
    #expect(effective.pages.count == 1)
    #expect(effective.pages[0].items.count == Entitlements.freeItemLimit)
    #expect(effective.headers.count == 1)
    #expect(effective.headers[0].configuration.arrangement == .classic)
    #expect(effective.headers[0].configuration.showsDateCaption == false)
    #expect(pro == configuration)
  }
}

struct OnboardingTests {
  let catalog = AppCatalog.bundled()

  func plan(_ ids: [String], assistant: Bool = false) -> [OnboardingStep] {
    let configuration = Configuration(
      pages: [LauncherPage(name: "Home", items: ids.map { LauncherItem(label: $0, target: .catalog(appID: $0)) })]
    )
    let router = LaunchRouter(
      catalog: catalog,
      capabilities: LaunchCapabilities(assistantReady: assistant, phoneShortcutInstalled: false)
    )
    return OnboardingPlan.steps(configuration: configuration, router: router)
  }

  @Test func onlyAsksForShortcutsTheChosenAppsNeed() {
    // Act
    let directApps = plan(["maps", "spotify"])
    let camera = plan(["camera"])
    let cameraWithAssistant = plan(["camera"], assistant: true)
    let phone = plan(["phone"])

    // Assert
    #expect(!directApps.contains(.assistant))
    #expect(!directApps.contains(.phoneShortcut))
    #expect(camera.contains(.assistant))
    #expect(!cameraWithAssistant.contains(.assistant))
    #expect(phone.contains(.phoneShortcut))
  }

  @Test func resumesAtFirstIncompleteStep() {
    // Arrange
    var progress = OnboardingProgress()
    let steps = plan(["maps"])
    progress.completed = [.welcome, .pickApps]

    // Act
    let next = progress.nextStep(in: steps)

    // Assert
    #expect(next == .theme)

    // Act
    progress.isFinished = true

    // Assert
    #expect(progress.nextStep(in: steps) == nil)
  }

  @Test func widgetInstructionsFollowTheOSVersion() {
    // Act
    let ios27 = OnboardingGuide.instructions(for: .addWidgets, systemMajorVersion: 27, appearance: .system)
    let ios18 = OnboardingGuide.instructions(for: .addWidgets, systemMajorVersion: 18, appearance: .system)
    let glass = OnboardingGuide.instructions(for: .hideDockAndBorders, systemMajorVersion: 26, appearance: .light)

    // Assert
    #expect(ios27.contains { $0.contains("full-page") })
    #expect(ios18.contains { $0.contains("leave it blank") })
    #expect(glass.contains { $0.contains("choose Light") })
    #expect(glass.contains { $0.contains("Clear and Tinted") })
  }

  @Test func homeScreenAppearanceMatchesTheWidgetAppearance() {
    // Act
    let system = OnboardingGuide.instructions(for: .hideDockAndBorders, systemMajorVersion: 26, appearance: .system)
    let dark = OnboardingGuide.instructions(for: .hideDockAndBorders, systemMajorVersion: 26, appearance: .dark)

    // Assert
    #expect(system.contains { $0.contains("choose Automatic") })
    #expect(dark.contains { $0.contains("choose Dark") })
  }
}

struct ThemeTests {
  @Test func systemAppearanceFollowsTheDevice() {
    // Arrange
    let theme = Theme.default

    // Act
    let light = theme.variant(system: .light)
    let dark = theme.variant(system: .dark)

    // Assert
    #expect(theme.appearance == .system)
    #expect(light == .light)
    #expect(dark == .dark)
    #expect(theme.pinnedVariant == nil)
  }

  @Test func pinnedAppearanceIgnoresTheDevice() {
    // Arrange
    let pinnedDark = Theme(appearance: .dark)
    let pinnedLight = Theme(appearance: .light)

    // Act
    let darkOnLightDevice = pinnedDark.variant(system: .light)
    let darkOnDarkDevice = pinnedDark.variant(system: .dark)
    let lightOnDarkDevice = pinnedLight.variant(system: .dark)

    // Assert
    #expect(darkOnLightDevice == .dark)
    #expect(darkOnDarkDevice == .dark)
    #expect(pinnedDark.pinnedVariant == .dark)
    #expect(lightOnDarkDevice == .light)
  }

  @Test func widgetsRenderTheExactCustomColors() {
    // Arrange
    let eggshell = RGBAColor(red: 0.941, green: 0.918, blue: 0.839)
    let graphite = RGBAColor(white: 0.11)
    var theme = Theme()

    // Act
    theme.setBackground(eggshell, for: .light)
    theme.setBackground(graphite, for: .dark)

    // Assert
    #expect(theme.colors(system: .light).background == eggshell)
    #expect(theme.colors(system: .dark).background == graphite)

    // Act
    theme.appearance = .light

    // Assert
    #expect(theme.colors(system: .dark).background == eggshell)
  }

  @Test func textStaysLegibleOnAnyBackground() {
    // Act
    let onWhite = ThemeColors(background: RGBAColor(white: 1))
    let onBlack = ThemeColors(background: RGBAColor(white: 0))
    let onEggshell = ThemeColors(background: Theme.lightPresets[1].color)

    // Assert
    #expect(onWhite.text.isDark)
    #expect(!onBlack.text.isDark)
    #expect(onEggshell.text.isDark)
  }

  @Test func partialThemeJSONDecodesWithDefaults() throws {
    // Arrange
    let json = Data(#"{"appearance":"dark","textSize":"large"}"#.utf8)

    // Act
    let theme = try JSONDecoder().decode(Theme.self, from: json)

    // Assert
    #expect(theme.appearance == .dark)
    #expect(theme.textSize == .large)
    #expect(theme.lightBackground == Theme.defaultLightBackground)
    #expect(theme.darkBackground == Theme.defaultDarkBackground)
  }

  @Test func customColorsSurviveTheSharedStore() {
    // Arrange
    let store = temporaryStore()
    let eggshell = Theme.lightPresets[1].color

    // Act
    store.updateConfiguration {
      $0.theme.appearance = .dark
      $0.theme.setBackground(eggshell, for: .light)
    }

    // Assert
    #expect(store.configuration.theme.appearance == .dark)
    #expect(store.configuration.theme.lightBackground == eggshell)
  }
}
