import Foundation

public enum ProProduct {
  public static let id = "com.novembersierra.plaintext.pro"
}

public struct Entitlements: Hashable, Sendable {
  public static let freeItemLimit = 6
  public static let freePageLimit = 1
  public static let freeHeaderLimit = 1

  public var isPro: Bool

  public init(isPro: Bool) {
    self.isPro = isPro
  }

  public func canAddItem(currentCount: Int) -> Bool {
    isPro || currentCount < Self.freeItemLimit
  }

  public func canAddPage(currentCount: Int) -> Bool {
    isPro || currentCount < Self.freePageLimit
  }

  public func canAddHeader(currentCount: Int) -> Bool {
    isPro || currentCount < Self.freeHeaderLimit
  }

  public func allows(_ module: HeaderModule) -> Bool {
    if isPro { return true }
    switch module {
    case .digitalClock, .date(.weekdayMonthDay), .weather(.current):
      return true
    default:
      return false
    }
  }

  public func allows(_ header: HeaderConfiguration) -> Bool {
    if isPro { return true }
    return header.arrangement == .classic && header.visibleModules.allSatisfy(allows)
  }

  /// What a lapsed or free user actually sees, so widgets never render locked features.
  public func effective(_ configuration: Configuration) -> Configuration {
    guard !isPro else { return configuration }
    var result = configuration
    result.pages = Array(configuration.pages.prefix(Self.freePageLimit)).map { page in
      var page = page
      page.items = Array(page.items.prefix(Self.freeItemLimit))
      return page
    }
    result.headers = Array(configuration.headers.prefix(Self.freeHeaderLimit)).map { layout in
      guard !allows(layout.configuration) else { return layout }
      var layout = layout
      var header = HeaderConfiguration.default
      header.showsDateCaption = layout.configuration.showsDateCaption
      header.showsWeatherCaption = layout.configuration.showsWeatherCaption
      layout.configuration = header
      return layout
    }
    return result
  }
}
