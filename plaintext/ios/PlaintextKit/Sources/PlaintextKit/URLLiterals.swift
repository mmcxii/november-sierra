import Foundation

extension URL {
  /// For URLs written in source. A typo traps at first use, so tests that touch the URL catch it.
  public init(literal: StaticString) {
    guard let url = URL(string: "\(literal)") else {
      preconditionFailure("Invalid URL literal: \(literal)")
    }
    self = url
  }
}

extension URLComponents {
  /// Components built from a fixed scheme and host always form a URL; this states that instead of `!`.
  var requiredURL: URL {
    guard let url else {
      preconditionFailure("URLComponents did not form a URL: \(self)")
    }
    return url
  }
}
