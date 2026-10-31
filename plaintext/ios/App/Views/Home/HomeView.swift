import PlaintextKit
import SwiftUI

struct HomeView: View {
  // MARK: Types
  private enum Editor: Hashable {
    case page(UUID)
    case header(UUID)
  }

  private enum PendingDelete {
    case page(UUID, String)
    case header(UUID, String)

    var title: String {
      switch self {
      case .page(_, let name), .header(_, let name): "Delete \(name)?"
      }
    }
  }

  // MARK: State
  @Environment(AppModel.self) private var model
  @State private var headerID: UUID?
  @State private var pageID: UUID?
  @State private var editor: Editor?
  @State private var pendingDelete: PendingDelete?
  @State private var renamingHeader = false
  @State private var renamingPage = false
  @State private var draftName = ""

  // MARK: Body
  var body: some View {
    let headers = model.configuration.headers
    let pages = model.configuration.pages
    let header = headers.first { $0.id == headerID }
    let page = pages.first { $0.id == pageID }

    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 32) {
          VStack(spacing: 8) {
            PeekCarousel(items: headers, selection: $headerID, emptyTitle: "No headers") { layout in
              HeaderPreview(layout: layout)
            }
            CarouselControls(
              name: header?.name,
              addLabel: "Add header",
              editLabel: "Edit header",
              deleteLabel: "Delete header",
              canEdit: header != nil,
              onRename: {
                draftName = header?.name ?? ""
                renamingHeader = true
              },
              onAdd: addHeader,
              onEdit: { if let header { editor = .header(header.id) } },
              onDelete: { if let header { pendingDelete = .header(header.id, header.name) } }
            )
          }
          VStack(spacing: 8) {
            PeekCarousel(items: pages, selection: $pageID, emptyTitle: "No pages") { page in
              PagePreview(page: page)
            }
            CarouselControls(
              name: page?.name,
              addLabel: "Add page",
              editLabel: "Edit page",
              deleteLabel: "Delete page",
              canEdit: page != nil,
              onRename: {
                draftName = page?.name ?? ""
                renamingPage = true
              },
              onAdd: addPage,
              onEdit: { if let page { editor = .page(page.id) } },
              onDelete: { if let page { pendingDelete = .page(page.id, page.name) } }
            )
          }
        }
        .padding(.vertical, 20)
      }
      .navigationTitle("Plaintext")
      .navigationDestination(item: $editor) { editor in
        switch editor {
        case .page(let id): PageEditorView(pageID: id)
        case .header(let id): HeaderEditorView(headerID: id)
        }
      }
      .toolbar {
        ToolbarItem(placement: .topBarTrailing) {
          NavigationLink {
            SettingsView()
          } label: {
            Image(systemName: "gearshape")
          }
          .accessibilityLabel("Settings")
        }
      }
      .alert("Rename header", isPresented: $renamingHeader) {
        TextField("Name", text: $draftName)
        Button("Save") { if let header { model.renameHeader(header.id, to: draftName) } }
        Button("Cancel", role: .cancel) {}
      }
      .alert("Rename page", isPresented: $renamingPage) {
        TextField("Name", text: $draftName)
        Button("Save") { if let page { model.renamePage(page.id, to: draftName) } }
        Button("Cancel", role: .cancel) {}
      }
      .confirmationDialog(
        pendingDelete?.title ?? "",
        isPresented: Binding(get: { pendingDelete != nil }, set: { if !$0 { pendingDelete = nil } }),
        titleVisibility: .visible
      ) {
        Button("Delete", role: .destructive) { performDelete() }
        Button("Cancel", role: .cancel) {}
      }
      .onAppear {
        if headerID == nil { headerID = headers.first?.id }
        if pageID == nil { pageID = pages.first?.id }
      }
      .onChange(of: headers.map(\.id)) { _, ids in
        if let headerID, ids.contains(headerID) { return }
        self.headerID = ids.first
      }
      .onChange(of: pages.map(\.id)) { _, ids in
        if let pageID, ids.contains(pageID) { return }
        self.pageID = ids.first
      }
    }
  }

  // MARK: Handlers
  private func addHeader() {
    let name = headersName()
    if let id = model.addHeader(named: name) { headerID = id }
  }

  private func addPage() {
    let name = pagesName()
    if let id = model.addPage(named: name) { pageID = id }
  }

  private func headersName() -> String {
    let headers = model.configuration.headers
    return headers.isEmpty ? "Header" : "Header \(headers.count + 1)"
  }

  private func pagesName() -> String {
    let pages = model.configuration.pages
    return pages.isEmpty ? "Home" : "Page \(pages.count + 1)"
  }

  private func performDelete() {
    switch pendingDelete {
    case .page(let id, _): model.removePage(id)
    case .header(let id, _): model.removeHeader(id)
    case nil: break
    }
  }
}
