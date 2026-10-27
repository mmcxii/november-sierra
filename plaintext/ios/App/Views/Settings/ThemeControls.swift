import PlaintextKit
import SwiftUI

struct ThemeControls: View {
  // MARK: State
  @Environment(AppModel.self) private var model

  // MARK: Body
  var body: some View {
    let theme = model.configuration.theme
    VStack(alignment: .leading, spacing: 8) {
      Picker("Widgets", selection: themeBinding(\.appearance)) {
        Text("System").tag(Theme.Appearance.system)
        Text("Light").tag(Theme.Appearance.light)
        Text("Dark").tag(Theme.Appearance.dark)
      }
      .pickerStyle(.segmented)
      Text(appearanceNote(theme.appearance))
        .font(.footnote)
        .foregroundStyle(.secondary)
    }
    BackgroundColorRow(variant: .light)
    BackgroundColorRow(variant: .dark)
    menu("Font", selection: themeBinding(\.typeface)) {
      ForEach(Theme.Typeface.allCases, id: \.self) { typeface in
        Text(typeface.rawValue.capitalized)
          .font(.system(.body, design: typeface.design))
          .tag(typeface)
      }
    }
    menu("Size", selection: themeBinding(\.textSize)) {
      Text("Small").tag(Theme.TextSize.small)
      Text("Medium").tag(Theme.TextSize.medium)
      Text("Large").tag(Theme.TextSize.large)
    }
    menu("Alignment", selection: themeBinding(\.alignment)) {
      Text("Left").tag(Theme.Alignment.leading)
      Text("Center").tag(Theme.Alignment.center)
    }
  }

  // MARK: Handlers
  private func appearanceNote(_ appearance: Theme.Appearance) -> String {
    switch appearance {
    case .system: "Widgets switch between your light and dark backgrounds with your iPhone's appearance."
    case .light: "Widgets always use the light background, even in Dark Mode."
    case .dark: "Widgets always use the dark background, even in Light Mode."
    }
  }

  private func themeBinding<Value>(_ keyPath: WritableKeyPath<Theme, Value>) -> Binding<Value> {
    Binding(
      get: { model.configuration.theme[keyPath: keyPath] },
      set: { value in model.updateConfiguration { $0.theme[keyPath: keyPath] = value } }
    )
  }

  private func menu<Value: Hashable>(
    _ title: String,
    selection: Binding<Value>,
    @ViewBuilder content: () -> some View
  ) -> some View {
    LabeledContent(title) {
      Picker(title, selection: selection, content: content)
        .labelsHidden()
    }
  }
}
