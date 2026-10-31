import PlaintextKit
import SwiftUI

struct PickAppsStep: View {
  // MARK: State
  @Environment(AppModel.self) private var model
  @State private var isSearching = false

  // MARK: Variables
  private static let suggestions = [
    "phone", "messages", "camera", "maps", "music", "calendar", "mail", "notes", "photos", "weather", "settings",
    "spotify", "whatsapp", "safari",
  ]

  // MARK: Body
  var body: some View {
    let page = model.configuration.pages.first
    let chosen = Set(
      page?.items.compactMap { item -> String? in
        if case .catalog(let id) = item.target { return id }
        return nil
      } ?? []
    )
    StepScaffold(
      title: "Pick your essentials", subtitle: "Choose what you'd keep on a simple phone. You can change this any time."
    ) {
      FlowLayout(spacing: 10) {
        ForEach(Self.suggestions.compactMap(model.catalog.app(id:))) { app in
          let isChosen = chosen.contains(app.id)
          Button {
            toggle(app, isChosen: isChosen)
          } label: {
            Text(app.name)
              .padding(.horizontal, 14)
              .padding(.vertical, 8)
              .background(isChosen ? Color.primary : Color.clear, in: Capsule())
              .overlay(Capsule().stroke(Color.primary.opacity(0.3)))
              .foregroundStyle(isChosen ? Color(uiColor: .systemBackground) : .primary)
          }
          .accessibilityAddTraits(isChosen ? .isSelected : [])
        }
      }
      Button("Search all apps") { isSearching = true }
      if !model.entitlements.isPro {
        Text("\(page?.items.count ?? 0) of \(Entitlements.freeItemLimit) on the free plan")
          .font(.footnote)
          .foregroundStyle(.secondary)
      }
    } actions: {
      Button("Continue") { model.complete(.pickApps) }
        .buttonStyle(PrimaryButtonStyle())
        .disabled(page?.items.isEmpty ?? true)
    }
    .sheet(isPresented: $isSearching) {
      NavigationStack { AddAppView(pageID: page?.id) }
    }
  }

  // MARK: Handlers
  private func toggle(_ app: CatalogApp, isChosen: Bool) {
    guard let page = model.configuration.pages.first else { return }
    if isChosen, let index = page.items.firstIndex(where: { $0.target == .catalog(appID: app.id) }) {
      model.removeItems(at: [index], fromPage: page.id)
    } else {
      model.add(app, toPage: page.id)
    }
  }
}
