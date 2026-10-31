import AppIntents
import Foundation
import PlaintextKit

struct PageEntity: AppEntity {
  static let typeDisplayRepresentation: TypeDisplayRepresentation = "Page"
  static let defaultQuery = PageQuery()

  var id: UUID
  var name: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(name)")
  }

  init(_ page: LauncherPage) {
    id = page.id
    name = page.name
  }
}

struct PageQuery: EntityQuery {
  func entities(for identifiers: [UUID]) async throws -> [PageEntity] {
    SharedStore.appGroup().configuration.pages
      .filter { identifiers.contains($0.id) }
      .map(PageEntity.init)
  }

  func suggestedEntities() async throws -> [PageEntity] {
    SharedStore.appGroup().configuration.pages.map(PageEntity.init)
  }

  func defaultResult() async -> PageEntity? {
    SharedStore.appGroup().configuration.pages.first.map(PageEntity.init)
  }
}

struct HeaderEntity: AppEntity {
  static let typeDisplayRepresentation: TypeDisplayRepresentation = "Header"
  static let defaultQuery = HeaderQuery()

  var id: UUID
  var name: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(name)")
  }

  init(_ header: HeaderLayout) {
    id = header.id
    name = header.name
  }
}

struct HeaderQuery: EntityQuery {
  func entities(for identifiers: [UUID]) async throws -> [HeaderEntity] {
    SharedStore.appGroup().configuration.headers
      .filter { identifiers.contains($0.id) }
      .map(HeaderEntity.init)
  }

  func suggestedEntities() async throws -> [HeaderEntity] {
    SharedStore.appGroup().configuration.headers.map(HeaderEntity.init)
  }

  /// A new widget starts on the first header. Leaving the slot empty is the minimal, header-free layout.
  func defaultResult() async -> HeaderEntity? {
    SharedStore.appGroup().configuration.headers.first.map(HeaderEntity.init)
  }
}

struct SelectPageIntent: WidgetConfigurationIntent {
  static let title: LocalizedStringResource = "Choose Header and Page"
  static let description = IntentDescription("Choose which header and page this widget shows.")

  @Parameter(title: "Header")
  var header: HeaderEntity?

  @Parameter(title: "Page")
  var page: PageEntity?

  init() {}
}
