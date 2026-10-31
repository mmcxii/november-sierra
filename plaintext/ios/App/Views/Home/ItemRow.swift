import PlaintextKit
import SwiftUI

struct ItemRow: View {
  // MARK: Inputs
  let item: LauncherItem

  // MARK: State
  @Environment(AppModel.self) private var model

  // MARK: Variables
  private var note: String? {
    switch model.router.plan(for: item.target) {
    case .direct: nil
    case .assistant: "via Assistant"
    case .shortcut: "via Shortcuts"
    case .needsSetup(.assistant): "needs Assistant"
    case .needsSetup(.phoneShortcut): "needs Phone shortcut"
    case .needsSetup(.missingApp): "re-add this app"
    }
  }

  // MARK: Body
  var body: some View {
    HStack {
      Text(item.label)
      Spacer()
      if let note {
        Text(note)
          .font(.footnote)
          .foregroundStyle(.secondary)
      }
    }
  }
}
