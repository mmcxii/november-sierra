import PlaintextKit
import SwiftUI

/// Opened from a widget tap that can't launch yet, so the fix is one step away instead of a silent failure.
struct SetupRequirementView: View {
  // MARK: Inputs
  let requirement: SetupRequirement

  // MARK: State
  @Environment(AppModel.self) private var model
  @Environment(\.dismiss) private var dismiss

  // MARK: Body
  var body: some View {
    NavigationStack {
      Group {
        switch requirement {
        case .assistant:
          AssistantStep()
        case .phoneShortcut:
          PhoneShortcutStep()
        case .missingApp:
          StepScaffold(
            title: "This app needs re-adding",
            subtitle: "It's no longer in the Plaintext catalog. Remove it from your list and add it again."
          ) {
            EmptyView()
          } actions: {
            Button("OK") { dismiss() }
              .buttonStyle(PrimaryButtonStyle())
          }
        }
      }
      .toolbar {
        ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } }
      }
    }
    .onChange(of: model.state.capabilities) { _, capabilities in
      let isResolved =
        switch requirement {
        case .assistant: capabilities.assistantReady
        case .phoneShortcut: capabilities.phoneShortcutInstalled
        case .missingApp: false
        }
      if isResolved { dismiss() }
    }
  }
}
