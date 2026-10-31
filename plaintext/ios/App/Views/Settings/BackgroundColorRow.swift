import PlaintextKit
import SwiftUI

/// One appearance's widget background: presets, with the custom color picker in the same row.
struct BackgroundColorRow: View {
  // MARK: Inputs
  let variant: ThemeVariant

  // MARK: State
  @Environment(AppModel.self) private var model

  // MARK: Variables
  private var title: String { variant == .light ? "Light background" : "Dark background" }
  private var presets: [Theme.Preset] { variant == .light ? Theme.lightPresets : Theme.darkPresets }
  private var defaultColor: RGBAColor {
    variant == .light ? Theme.defaultLightBackground : Theme.defaultDarkBackground
  }

  private var colorBinding: Binding<Color> {
    Binding(
      get: { model.configuration.theme.background(for: variant).color },
      set: { set(RGBAColor($0)) }
    )
  }

  // MARK: Body
  var body: some View {
    let current = model.configuration.theme.background(for: variant)
    VStack(alignment: .leading, spacing: 10) {
      Text(title)
      HStack(spacing: 12) {
        ForEach(presets, id: \.name) { preset in
          Button {
            set(preset.color)
          } label: {
            Circle()
              .fill(preset.color.color)
              .frame(width: 28, height: 28)
              .overlay(Circle().strokeBorder(.secondary.opacity(0.4), lineWidth: 1))
              .overlay {
                if preset.color == current {
                  Image(systemName: "checkmark")
                    .font(.caption.bold())
                    .foregroundStyle(ThemeColors(background: preset.color).text.color)
                }
              }
          }
          .buttonStyle(.borderless)
          .accessibilityLabel(preset.name)
          .accessibilityAddTraits(preset.color == current ? .isSelected : [])
        }
        ColorPicker("Custom color", selection: colorBinding, supportsOpacity: false)
          .labelsHidden()
          .frame(width: 28, height: 28)
          .accessibilityLabel("Custom \(title)")
        Spacer(minLength: 0)
        if current != defaultColor {
          Button("Reset") { set(defaultColor) }
            .font(.footnote)
            .buttonStyle(.borderless)
        }
      }
    }
  }

  // MARK: Handlers
  private func set(_ color: RGBAColor) {
    model.updateConfiguration { $0.theme.setBackground(color, for: variant) }
  }
}
