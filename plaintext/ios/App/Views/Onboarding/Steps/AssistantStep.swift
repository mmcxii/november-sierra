import PlaintextKit
import SwiftUI

struct AssistantStep: View {
  // MARK: State
  @Environment(AppModel.self) private var model
  @Environment(\.openURL) private var openURL

  // MARK: Body
  var body: some View {
    StepScaffold(
      title: "Set up the Assistant",
      subtitle:
        "Some apps can't be opened directly. The Assistant opens them for you, without the Shortcuts app popping up."
    ) {
      NumberedSteps(
        steps: OnboardingGuide.instructions(
          for: .assistant,
          systemMajorVersion: model.systemMajorVersion,
          appearance: model.configuration.theme.appearance
        )
      )
      if model.state.capabilities.assistantReady {
        Label("Assistant ready", systemImage: "checkmark.circle")
      }
    } actions: {
      ShortcutInstallButton(shortcut: .assistant, title: "Add Assistant Shortcut")
      Button("Open Shortcuts") { openURL(URL(literal: "shortcuts://")) }
        .buttonStyle(SecondaryButtonStyle())
      Button("Skip for now") { model.complete(.assistant) }
        .buttonStyle(SecondaryButtonStyle())
    }
    .onChange(of: model.state.capabilities.assistantReady) { _, ready in
      if ready { model.complete(.assistant) }
    }
    .task {
      // The automation checks in a moment after Plaintext becomes active, so watch for it rather than reading once.
      while !Task.isCancelled {
        model.reload()
        try? await Task.sleep(for: .seconds(1))
      }
    }
  }
}
