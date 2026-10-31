import PlaintextKit
import SwiftUI

/// Draws a page widget at its home screen size. `containerBackground` only paints inside WidgetKit, so the
/// background is resolved the same way here; the gray margin marks the widget's edge.
struct WidgetSnapshotView: View {
  let snapshot: WidgetSnapshot

  private var entry: LauncherEntry {
    let date = SnapshotFixtures.date
    return LauncherEntry(
      date: date,
      page: SnapshotFixtures.page,
      isLockedPage: false,
      configuration: Configuration(pages: [SnapshotFixtures.page], theme: snapshot.theme),
      header: snapshot.header.map { header in
        HeaderContent(
          date: date,
          header: header,
          preferences: .default,
          theme: snapshot.theme,
          weather: SnapshotFixtures.weather,
          quote: SnapshotFixtures.quote,
          nextEvent: SnapshotFixtures.nextEvent
        )
      }
    )
  }

  var body: some View {
    LauncherWidgetView(entry: entry, family: snapshot.size.family)
      .frame(width: snapshot.size.size.width, height: snapshot.size.size.height)
      .background(snapshot.theme.colors(system: snapshot.device).background.color)
      .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
      .padding(16)
      .background(Color.gray)
      .environment(\.colorScheme, snapshot.device.colorScheme)
  }
}
