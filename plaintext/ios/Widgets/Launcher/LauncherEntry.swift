import PlaintextKit
import SwiftUI
import WidgetKit

struct LauncherEntry: TimelineEntry {
  var date: Date
  var page: LauncherPage?
  var isLockedPage: Bool
  var isLockedHeader = false
  /// The chosen page or header was deleted. The widget shows a prompt instead of a partial layout.
  var isUnavailable = false
  var configuration: Configuration
  var header: HeaderContent?
}
