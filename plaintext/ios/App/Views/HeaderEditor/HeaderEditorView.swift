import PlaintextKit
import SwiftUI

struct HeaderEditorView: View {
  // MARK: Inputs
  let headerID: UUID

  // MARK: State
  @Environment(AppModel.self) private var model
  @Environment(LocationModel.self) private var location

  // MARK: Variables
  private var layout: HeaderLayout? {
    model.configuration.headers.first { $0.id == headerID }
  }

  // MARK: Body
  var body: some View {
    if let layout {
      editor(layout)
    } else {
      ContentUnavailableView("This header was deleted", systemImage: "clock")
    }
  }

  // MARK: Handlers
  private func editor(_ layout: HeaderLayout) -> some View {
    let header = layout.configuration
    let isPro = model.entitlements.isPro
    return Form {
      Section {
        HeaderPreview(layout: layout)
          .listRowInsets(EdgeInsets())
          .listRowBackground(Color.clear)
      }

      Section("Layout") {
        Picker("Arrangement", selection: binding(\.arrangement)) {
          Text("Classic").tag(HeaderConfiguration.Arrangement.classic)
          Text(isPro ? "Side by side" : "Side by side (Pro)").tag(HeaderConfiguration.Arrangement.sideBySide)
          Text(isPro ? "Stacked" : "Stacked (Pro)").tag(HeaderConfiguration.Arrangement.stacked)
        }
      }

      Section(header.arrangement == .classic ? "Main" : "First") {
        ModuleEditor(module: binding(\.primary))
      }

      if header.arrangement == .classic {
        Section {
          Toggle("Show date", isOn: binding(\.showsDateCaption))
          Toggle("Show weather", isOn: binding(\.showsWeatherCaption))
        } footer: {
          Text("Shown in one line under the main item.")
        }
      } else {
        Section("Second") {
          ModuleEditor(module: binding(\.secondary))
        }
      }

      if !isPro {
        Section {
          Button("Unlock every header with Pro") { model.isShowingPaywall = true }
        }
      }
    }
    .navigationTitle(layout.name)
    .onChange(of: header.visibleModules) { _, modules in
      if modules.contains(where: { if case .weather = $0 { true } else { false } }) {
        location.requestIfNeeded()
      }
    }
  }

  /// Edits that would show a locked feature open the paywall instead of saving.
  private func binding<Value>(_ keyPath: WritableKeyPath<HeaderConfiguration, Value>) -> Binding<Value> {
    Binding(
      get: {
        model.configuration.headers.first { $0.id == headerID }?.configuration[keyPath: keyPath]
          ?? HeaderConfiguration.default[keyPath: keyPath]
      },
      set: { value in
        guard var layout = model.configuration.headers.first(where: { $0.id == headerID }) else { return }
        layout.configuration[keyPath: keyPath] = value
        guard model.entitlements.allows(layout.configuration) else {
          model.isShowingPaywall = true
          return
        }
        model.updateHeader(headerID) { $0.configuration = layout.configuration }
      }
    )
  }
}
