import PlaintextKit
import SwiftUI

/// The apps on one page: rename a label, reorder, add, and remove.
struct PageEditorView: View {
  // MARK: Inputs
  let pageID: UUID

  // MARK: State
  @Environment(AppModel.self) private var model
  @State private var adding = false
  @State private var renaming: LauncherItem?
  @State private var newLabel = ""

  // MARK: Body
  var body: some View {
    if let page = model.configuration.pages.first(where: { $0.id == pageID }) {
      List {
        Section {
          ForEach(page.items) { item in
            ItemRow(item: item)
              .contentShape(Rectangle())
              .onTapGesture {
                newLabel = item.label
                renaming = item
              }
          }
          .onDelete { model.removeItems(at: $0, fromPage: page.id) }
          .onMove { model.moveItems(from: $0, to: $1, inPage: page.id) }
          Button {
            adding = true
          } label: {
            Label("Add app", systemImage: "plus")
          }
        } footer: {
          Text(footer(page))
        }
      }
      .navigationTitle(page.name)
      .toolbar {
        ToolbarItem(placement: .topBarTrailing) { EditButton() }
      }
      .sheet(isPresented: $adding) {
        NavigationStack { AddAppView(pageID: page.id) }
      }
      .alert("Rename", isPresented: Binding(get: { renaming != nil }, set: { if !$0 { renaming = nil } })) {
        TextField("Name", text: $newLabel)
        Button("Save") {
          if let renaming { model.rename(renaming.id, to: newLabel) }
        }
        Button("Cancel", role: .cancel) {}
      }
    } else {
      ContentUnavailableView("This page was deleted", systemImage: "list.bullet")
    }
  }

  // MARK: Handlers
  private func footer(_ page: LauncherPage) -> String {
    let rename = "Tap a name to change its label."
    guard !model.entitlements.isPro else { return rename }
    return "\(page.items.count) of \(Entitlements.freeItemLimit) on the free plan. \(rename)"
  }
}
