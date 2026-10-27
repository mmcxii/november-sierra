import AppIntents
import Foundation
import PlaintextKit
import UniformTypeIdentifiers

#if canImport(UIKit)
  import UIKit
#endif

/// The first action in the "Plaintext Assistant" shortcut, which runs every time Plaintext opens.
/// Returns the app the user just tapped, or an empty string so the shortcut's "If" check falls through.
struct GetAppToOpenIntent: AppIntent {
  static let title: LocalizedStringResource = "Get App to Open"
  static let description = IntentDescription(
    "Used by the Plaintext Assistant shortcut. Returns the name of the app you just tapped in a Plaintext widget."
  )

  func perform() async throws -> some IntentResult & ReturnsValue<String> {
    .result(value: SharedStore.appGroup().consumePendingLaunch() ?? "")
  }
}

/// Used by the "Plaintext Wallpaper" shortcut, which pipes the file into Shortcuts' Set Wallpaper action.
struct GetWallpaperIntent: AppIntent {
  static let title: LocalizedStringResource = "Get Plaintext Wallpaper"
  static let description = IntentDescription(
    "Returns one solid wallpaper, named for the phone's current appearance: Light or Dark."
  )

  func perform() async throws -> some IntentResult & ReturnsValue<IntentFile> & ProvidesDialog {
    let theme = SharedStore.appGroup().configuration.theme
    let appearance = await WallpaperRenderer.deviceAppearance()
    let color = theme.background(for: appearance)
    guard let data = await WallpaperRenderer.pngData(for: color) else {
      throw WallpaperError.renderFailed
    }
    let dialog: IntentDialog = appearance == .light ? "Using your light color." : "Using your dark color."
    return .result(
      value: IntentFile(data: data, filename: WallpaperRenderer.filename(for: appearance), type: .png),
      dialog: dialog
    )
  }

  enum WallpaperError: Error, CustomLocalizedStringResourceConvertible {
    case renderFailed

    var localizedStringResource: LocalizedStringResource { "Plaintext couldn't create the wallpaper." }
  }
}

enum WallpaperRenderer {
  static func filename(for appearance: ThemeVariant) -> String {
    appearance == .light ? "Plaintext Light.png" : "Plaintext Dark.png"
  }

  /// The phone's current appearance, independent of the widget theme pin. Shortcuts has no view of its own.
  @MainActor
  static func deviceAppearance() -> ThemeVariant {
    #if canImport(UIKit)
      UITraitCollection.current.userInterfaceStyle == .dark ? .dark : .light
    #else
      .light
    #endif
  }

  /// Pixel size of the phone's screen. A solid tile at this size needs no crop when it is set as the wallpaper.
  @MainActor
  static var screenPixelSize: CGSize {
    #if canImport(UIKit)
      let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
      if let screen = scene?.screen {
        let width = screen.bounds.width * screen.scale
        let height = screen.bounds.height * screen.scale
        return CGSize(width: width, height: height)
      }
    #endif
    return CGSize(width: 1320, height: 2868)
  }

  @MainActor
  static func pngData(for color: RGBAColor) -> Data? {
    #if canImport(UIKit)
      let size = screenPixelSize
      let format = UIGraphicsImageRendererFormat()
      format.scale = 1
      let renderer = UIGraphicsImageRenderer(size: size, format: format)
      return renderer.pngData { context in
        color.uiColor.setFill()
        context.fill(CGRect(origin: .zero, size: size))
      }
    #else
      return nil
    #endif
  }
}

struct PlaintextShortcutsProvider: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: GetAppToOpenIntent(),
      phrases: ["Get app to open in \(.applicationName)"],
      shortTitle: "Get App to Open",
      systemImageName: "arrow.up.forward.app"
    )
    AppShortcut(
      intent: GetWallpaperIntent(),
      phrases: ["Get \(.applicationName) wallpaper"],
      shortTitle: "Get Wallpaper",
      systemImageName: "photo"
    )
  }
}
