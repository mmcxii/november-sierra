import Foundation

/// The two looks a widget can render in. Matches the system's light and dark appearance.
public enum ThemeVariant: String, Codable, CaseIterable, Sendable {
  case light
  case dark
}

public struct ThemeColors: Hashable, Sendable {
  public var background: RGBAColor
  public var text: RGBAColor

  /// Text is derived from the background so any custom color stays legible.
  public init(background: RGBAColor) {
    self.background = background
    text = background.isDark ? RGBAColor(white: 0.92) : RGBAColor(white: 0.08)
  }
}

public struct Theme: Codable, Hashable, Sendable {
  public enum Appearance: String, Codable, CaseIterable, Sendable {
    /// Light widgets when the device is in light mode, dark widgets in dark mode.
    case system
    /// Always the light background, whatever the device is set to.
    case light
    /// Always the dark background, whatever the device is set to.
    case dark
  }

  public enum Typeface: String, Codable, CaseIterable, Sendable {
    case system
    case serif
    case mono
    case rounded
  }

  public enum TextSize: String, Codable, CaseIterable, Sendable {
    case small
    case medium
    case large

    public var launcherPointSize: Double {
      switch self {
      case .small: 22
      case .medium: 26
      case .large: 31
      }
    }
  }

  public enum Alignment: String, Codable, CaseIterable, Sendable {
    case leading
    case center
  }

  public struct Preset: Hashable, Sendable {
    public var name: String
    public var color: RGBAColor
  }

  public static let defaultLightBackground = RGBAColor(red: 1, green: 1, blue: 1)
  public static let defaultDarkBackground = RGBAColor(white: 0)

  public static let lightPresets = [
    Preset(name: "White", color: defaultLightBackground),
    Preset(name: "Eggshell", color: RGBAColor(red: 0.941, green: 0.918, blue: 0.839)),
    Preset(name: "Paper", color: RGBAColor(white: 0.95)),
    Preset(name: "Sand", color: RGBAColor(red: 0.91, green: 0.87, blue: 0.80)),
  ]

  public static let darkPresets = [
    Preset(name: "Black", color: defaultDarkBackground),
    Preset(name: "Graphite", color: RGBAColor(white: 0.11)),
    Preset(name: "Slate", color: RGBAColor(red: 0.16, green: 0.18, blue: 0.21)),
    Preset(name: "Ink", color: RGBAColor(red: 0.07, green: 0.09, blue: 0.16)),
  ]

  public var appearance: Appearance
  public var lightBackground: RGBAColor
  public var darkBackground: RGBAColor
  public var typeface: Typeface
  public var textSize: TextSize
  public var alignment: Alignment

  public init(
    appearance: Appearance = .system,
    lightBackground: RGBAColor = Theme.defaultLightBackground,
    darkBackground: RGBAColor = Theme.defaultDarkBackground,
    typeface: Typeface = .system,
    textSize: TextSize = .medium,
    alignment: Alignment = .leading
  ) {
    self.appearance = appearance
    self.lightBackground = lightBackground
    self.darkBackground = darkBackground
    self.typeface = typeface
    self.textSize = textSize
    self.alignment = alignment
  }

  public static let `default` = Theme()

  /// The variant to draw when the device is in `system`; a pinned appearance wins over it.
  public func variant(system: ThemeVariant) -> ThemeVariant {
    switch appearance {
    case .system: system
    case .light: .light
    case .dark: .dark
    }
  }

  public var pinnedVariant: ThemeVariant? {
    switch appearance {
    case .system: nil
    case .light: .light
    case .dark: .dark
    }
  }

  public func background(for variant: ThemeVariant) -> RGBAColor {
    variant == .light ? lightBackground : darkBackground
  }

  public mutating func setBackground(_ color: RGBAColor, for variant: ThemeVariant) {
    switch variant {
    case .light: lightBackground = color
    case .dark: darkBackground = color
    }
  }

  public func colors(system: ThemeVariant) -> ThemeColors {
    ThemeColors(background: background(for: variant(system: system)))
  }

  private enum CodingKeys: String, CodingKey {
    case appearance, lightBackground, darkBackground, typeface, textSize, alignment
  }

  /// Missing keys fall back to defaults, so adding theme options never wipes a saved configuration.
  public init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    let fallback = Theme.default
    appearance = try container.decodeIfPresent(Appearance.self, forKey: .appearance) ?? fallback.appearance
    lightBackground =
      try container.decodeIfPresent(RGBAColor.self, forKey: .lightBackground) ?? fallback.lightBackground
    darkBackground = try container.decodeIfPresent(RGBAColor.self, forKey: .darkBackground) ?? fallback.darkBackground
    typeface = try container.decodeIfPresent(Typeface.self, forKey: .typeface) ?? fallback.typeface
    textSize = try container.decodeIfPresent(TextSize.self, forKey: .textSize) ?? fallback.textSize
    alignment = try container.decodeIfPresent(Alignment.self, forKey: .alignment) ?? fallback.alignment
  }
}
