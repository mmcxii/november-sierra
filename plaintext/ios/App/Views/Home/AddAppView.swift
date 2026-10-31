import PlaintextKit
import SwiftUI

struct AddAppView: View {
  // MARK: Inputs
  let pageID: UUID?

  // MARK: State
  @Environment(AppModel.self) private var model
  @Environment(\.dismiss) private var dismiss
  @State private var query = ""
  @State private var isAddingCustom = false

  // MARK: Body
  var body: some View {
    let results = model.catalog.search(query)
    List {
      ForEach(results) { app in
        Button {
          model.add(app, toPage: pageID)
          dismiss()
        } label: {
          HStack {
            Text(app.name).foregroundStyle(.primary)
            Spacer()
            if app.launch != .direct {
              Text(app.launch == .phoneShortcut ? "needs shortcut" : "via Assistant")
                .font(.footnote)
                .foregroundStyle(.secondary)
            }
          }
        }
      }
      Section {
        Button("Don't see your app?") { isAddingCustom = true }
      }
    }
    .navigationTitle("Add app")
    .navigationBarTitleDisplayMode(.inline)
    .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always))
    .toolbar {
      ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
    }
    .navigationDestination(isPresented: $isAddingCustom) {
      CustomAppView(pageID: pageID, initialName: query) { dismiss() }
    }
    .task(id: query) {
      try? await Task.sleep(for: .seconds(1.5))
      guard !Task.isCancelled else { return }
      await MissedSearchReporter.reportIfNeeded(query: query, resultCount: results.count)
    }
  }
}
