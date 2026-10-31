import PlaintextKit
import SwiftUI
import WidgetKit

#if canImport(UIKit)
  import UIKit
#endif

extension RGBAColor {
  var color: Color {
    Color(.sRGB, red: red, green: green, blue: blue, opacity: alpha)
  }

  #if canImport(UIKit)
    var uiColor: UIColor {
      UIColor(red: red, green: green, blue: blue, alpha: alpha)
    }

    /// Wide-gamut picks come back outside 0...1 in extended sRGB; widgets store plain sRGB.
    init(_ color: Color) {
      var red: CGFloat = 0
      var green: CGFloat = 0
      var blue: CGFloat = 0
      var alpha: CGFloat = 0
      UIColor(color).getRed(&red, green: &green, blue: &blue, alpha: &alpha)
      func clamped(_ value: CGFloat) -> Double { min(max(Double(value), 0), 1) }
      self.init(red: clamped(red), green: clamped(green), blue: clamped(blue), alpha: clamped(alpha))
    }
  #endif
}

extension ColorScheme {
  var themeVariant: ThemeVariant { self == .dark ? .dark : .light }
}

extension ThemeVariant {
  var colorScheme: ColorScheme { self == .dark ? .dark : .light }
}

extension Theme {
  func colors(for scheme: ColorScheme) -> ThemeColors {
    colors(system: scheme.themeVariant)
  }

  /// `nil` lets the system decide; a pinned appearance forces one scheme everywhere it's applied.
  var preferredColorScheme: ColorScheme? { pinnedVariant?.colorScheme }

  func font(size: Double, weight: Font.Weight = .regular) -> Font {
    .system(size: size, weight: weight, design: typeface.design)
  }

  var horizontalAlignment: HorizontalAlignment {
    alignment == .center ? .center : .leading
  }

  var textAlignment: TextAlignment {
    alignment == .center ? .center : .leading
  }

  var frameAlignment: SwiftUI.Alignment {
    alignment == .center ? .center : .leading
  }
}

extension Theme.Typeface {
  var design: Font.Design {
    switch self {
    case .system: .default
    case .serif: .serif
    case .mono: .monospaced
    case .rounded: .rounded
    }
  }
}

extension Theme.TextSize {
  func rows(forHeight height: Double) -> Int {
    max(1, Int(height / (launcherPointSize * 1.75)))
  }
}
