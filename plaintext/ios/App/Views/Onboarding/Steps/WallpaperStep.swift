import PlaintextKit
import SwiftUI

struct WallpaperStep: View {
  // MARK: State
  @Environment(AppModel.self) private var model
  @State private var message: String?

  // MARK: Body
  var body: some View {
    let theme = model.configuration.theme
    StepScaffold(
      title: "Match the wallpaper",
      subtitle: "Your widgets disappear into the wallpaper, so only the words remain."
    ) {
      InstructionVideo(step: .wallpaper, systemMajorVersion: model.systemMajorVersion)
        .frame(maxWidth: .infinity)
      NumberedSteps(
        steps: OnboardingGuide.instructions(
          for: .wallpaper, systemMajorVersion: model.systemMajorVersion, appearance: theme.appearance)
      )
      if let message {
        Text(message).font(.footnote).foregroundStyle(.secondary)
      }
    } actions: {
      Button("Save Wallpaper") { save(theme) }
        .buttonStyle(PrimaryButtonStyle())
      Button("I already set it") { model.complete(.wallpaper) }
        .buttonStyle(SecondaryButtonStyle())
    }
  }

  // MARK: Handlers
  private func save(_ theme: Theme) {
    Task {
      do {
        try await WallpaperTools.saveToPhotos(theme)
        message = "Saved a light photo and a dark photo."
      } catch {
        message = error.localizedDescription
      }
    }
  }
}
