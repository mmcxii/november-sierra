import PlaintextKit
import SwiftUI
import WidgetKit

struct LauncherProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> LauncherEntry {
    let items = ["Phone", "Messages", "Maps", "Music", "Camera", "Notes"].map {
      LauncherItem(label: $0, target: .catalog(appID: $0.lowercased()))
    }
    let configuration = Configuration.empty
    return LauncherEntry(
      date: Date(),
      page: LauncherPage(name: "Home", items: items),
      isLockedPage: false,
      configuration: configuration,
      header: HeaderContent(
        date: Date(),
        header: configuration.headers.first?.configuration ?? .default,
        preferences: configuration.preferences,
        theme: configuration.theme,
        weather: nil,
        quote: nil,
        nextEvent: nil
      )
    )
  }

  func snapshot(for configuration: SelectPageIntent, in context: Context) async -> LauncherEntry {
    // The widget gallery asks for a snapshot before a page or header has been chosen.
    if context.isPreview, configuration.page == nil, configuration.header == nil {
      return placeholder(in: context)
    }
    return await entry(for: configuration, at: Date())
  }

  func timeline(for configuration: SelectPageIntent, in context: Context) async -> Timeline<LauncherEntry> {
    let first = await entry(for: configuration, at: Date())
    guard first.header != nil else {
      return Timeline(entries: [first], policy: .never)
    }
    let dates = MinuteTimeline.dates(from: Date())
    let entries = dates.map { date in
      var entry = first
      entry.date = date
      entry.header?.date = date
      if entry.header?.quote != nil {
        entry.header?.quote = QuoteOfTheDay.quote(for: date, from: QuoteOfTheDay.bundled())
      }
      return entry
    }
    return Timeline(entries: entries, policy: .atEnd)
  }

  private func entry(for intent: SelectPageIntent, at date: Date) async -> LauncherEntry {
    let store = SharedStore.appGroup()
    let state = store.state
    let full = store.configuration
    let effective = Entitlements(isPro: state.isPro).effective(full)
    let requestedPage = intent.page.flatMap { entity in full.pages.first { $0.id == entity.id } }
    let requestedHeader = intent.header.flatMap { entity in full.headers.first { $0.id == entity.id } }
    let pageMissing = intent.page == nil || requestedPage == nil
    let headerMissing = intent.header != nil && requestedHeader == nil

    if pageMissing || headerMissing {
      return LauncherEntry(
        date: date,
        page: nil,
        isLockedPage: false,
        isUnavailable: true,
        configuration: effective,
        header: nil
      )
    }

    let page = effective.pages.first { $0.id == requestedPage?.id }
    let isLockedPage = page == nil
    let layout = requestedHeader.flatMap { header in effective.headers.first { $0.id == header.id } }
    let isLockedHeader = requestedHeader != nil && layout == nil
    let header: HeaderContent?
    if let layout {
      header = await HeaderDataSource.content(
        at: date,
        header: layout.configuration,
        preferences: effective.preferences,
        theme: effective.theme,
        store: store
      )
    } else {
      header = nil
    }
    return LauncherEntry(
      date: date,
      page: page,
      isLockedPage: isLockedPage,
      isLockedHeader: isLockedHeader,
      configuration: effective,
      header: header
    )
  }
}
