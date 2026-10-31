import PlaintextKit
import SwiftUI

struct CustomAppView: View {
  // MARK: Types
  enum Kind: String, CaseIterable, Identifiable {
    case anyApp = "Any app"
    case url = "Link"
    case shortcut = "Shortcut"

    var id: String { rawValue }
  }

  // MARK: Inputs
  let pageID: UUID?
  let initialName: String
  let onAdded: () -> Void

  // MARK: State
  @Environment(AppModel.self) private var model
  @Environment(\.openURL) private var openURL
  @State private var kind = Kind.anyApp
  @State private var name = ""
  @State private var link = ""

  // MARK: Body
  var body: some View {
    Form {
      Picker("Type", selection: $kind) {
        ForEach(Kind.allCases) { Text($0.rawValue).tag($0) }
      }
      .pickerStyle(.segmented)

      switch kind {
      case .anyApp:
        Section {
          TextField("App name, exactly as on your home screen", text: $name)
            .textInputAutocapitalization(.never)
        } footer: {
          Text(
            model.state.capabilities.assistantReady
              ? "The Assistant opens any installed app by its name."
              : "Opening apps by name needs the Assistant. You can set it up after adding."
          )
        }
        Button("Add") { add(.assistant(appName: name.trimmed), label: name.trimmed) }
          .disabled(name.trimmed.isEmpty)
      case .url:
        Section {
          TextField("Name", text: $name)
          TextField("URL, like obsidian://", text: $link)
            .keyboardType(.URL)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
        } footer: {
          Text(
            "Links open directly, with no detour. Search the web for the app's name plus \u{201C}URL scheme\u{201D}.")
        }
        Button("Add") {
          if let url = URL(string: link.trimmed), url.scheme != nil {
            add(.url(url), label: name.trimmed)
          }
        }
        .disabled(name.trimmed.isEmpty || URL(string: link.trimmed)?.scheme == nil)
      case .shortcut:
        Section {
          NumberedSteps(steps: [
            "In Shortcuts, make a shortcut with the Open App action and choose your app.",
            "Add the Plaintext Add Shortcut tool below, then run it from the Shortcuts app.",
            "Pick your shortcut from the list. It appears in Plaintext right away.",
          ])
        }
        ShortcutInstallButton(shortcut: .addShortcut, title: "Add the Plaintext Add Shortcut tool")
          .listRowBackground(Color.clear)
          .listRowInsets(EdgeInsets())
      }
    }
    .navigationTitle("Custom app")
    .onAppear { name = initialName }
  }

  // MARK: Handlers
  private func add(_ target: LaunchTarget, label: String) {
    if model.add(target, label: label, toPage: pageID) {
      onAdded()
    }
  }
}
