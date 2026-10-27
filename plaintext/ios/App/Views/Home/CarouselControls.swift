import SwiftUI

/// The name under a carousel card, plus add on the left and edit and delete on the right.
struct CarouselControls: View {
  // MARK: Inputs
  var name: String?
  let addLabel: String
  let editLabel: String
  let deleteLabel: String
  var canEdit: Bool
  let onRename: () -> Void
  let onAdd: () -> Void
  let onEdit: () -> Void
  let onDelete: () -> Void

  // MARK: Body
  var body: some View {
    VStack(spacing: 4) {
      if let name {
        Button(name, action: onRename)
          .font(.headline)
          .lineLimit(1)
          .buttonStyle(.plain)
          .frame(maxWidth: .infinity)
          .accessibilityHint("Rename")
      }
      HStack(spacing: 4) {
        icon("plus", label: addLabel, action: onAdd)
        Spacer(minLength: 0)
        icon("pencil", label: editLabel, action: onEdit)
          .disabled(!canEdit)
        icon("trash", label: deleteLabel, action: onDelete)
          .disabled(!canEdit)
      }
    }
    .padding(.horizontal, 16)
  }

  // MARK: Handlers
  private func icon(_ systemName: String, label: String, action: @escaping () -> Void) -> some View {
    Button(action: action) {
      Image(systemName: systemName)
        .font(.body.weight(.medium))
        .frame(width: 44, height: 44)
        .foregroundStyle(.primary)
    }
    .buttonStyle(.plain)
    .accessibilityLabel(label)
  }
}
