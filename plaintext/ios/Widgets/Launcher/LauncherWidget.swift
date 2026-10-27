import PlaintextKit
import SwiftUI
import WidgetKit

struct LauncherWidget: Widget {
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: "Launcher", intent: SelectPageIntent.self, provider: LauncherProvider()) { entry in
      LauncherWidgetView(entry: entry)
    }
    .configurationDisplayName("Plaintext")
    .description("One page of your apps, with a header or without one. Edit the widget to choose.")
    .supportedFamilies(Self.families)
    .contentMarginsDisabled()
  }

  /// Every size shows the same page. A larger frame fits more of it.
  static var families: [WidgetFamily] {
    #if compiler(>=6.4)
      if #available(iOS 27, *) {
        return [.systemExtraLargePortrait, .systemLarge, .systemMedium, .systemSmall]
      }
    #endif
    return [.systemLarge, .systemMedium, .systemSmall]
  }
}
