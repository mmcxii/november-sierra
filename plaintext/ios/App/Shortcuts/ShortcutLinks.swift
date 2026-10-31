import Foundation
import PlaintextKit

/// iCloud share links for the prebuilt shortcuts. iOS only imports shortcuts Apple has signed, so each one is
/// built on a device from the specs in `plaintext/docs/shortcuts.md`, shared, and its link added here.
enum ShortcutLinks {
  static let links: [PrebuiltShortcut: URL] = [:]

  static func url(for shortcut: PrebuiltShortcut) -> URL? {
    links[shortcut]
  }
}
