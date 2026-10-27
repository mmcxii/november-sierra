import Foundation
import SwiftOperators
import SwiftParser
import SwiftSyntax

public struct Violation: Hashable, Sendable, CustomStringConvertible {
  public var rule: String
  public var message: String
  public var line: Int
  public var column: Int

  public var description: String { "\(line):\(column): \(message) [\(rule)]" }
}

public protocol Rule: Sendable {
  var id: String { get }
  func check(_ file: SourceFile) -> [Violation]
}

/// A parsed file with operators folded, so `a ? b : c` and `x as! T` appear as real expression nodes.
public struct SourceFile {
  public let name: String
  public let tree: SourceFileSyntax
  let lines: [Substring]
  private let converter: SourceLocationConverter

  public init(name: String, source: String) {
    self.name = name
    let parsed = Parser.parse(source: source)
    tree = OperatorTable.standardOperators.foldAll(parsed) { _ in }.as(SourceFileSyntax.self) ?? parsed
    lines = source.split(separator: "\n", omittingEmptySubsequences: false)
    converter = SourceLocationConverter(fileName: name, tree: tree)
  }

  func violation(_ rule: any Rule, _ message: String, at node: some SyntaxProtocol) -> Violation {
    violation(rule, message, at: node.positionAfterSkippingLeadingTrivia)
  }

  func violation(_ rule: any Rule, _ message: String, at position: AbsolutePosition) -> Violation {
    let location = converter.location(for: position)
    return Violation(rule: rule.id, message: message, line: location.line, column: location.column)
  }

  func line(of position: AbsolutePosition) -> Int {
    converter.location(for: position).line
  }
}

public enum Linter {
  public static let rules: [any Rule] = [
    ViewSectionsRule(),
    ViewEffectsLastRule(),
    OneViewPerFileRule(),
    NoNestedTernaryRule(),
    NoForceCastRule(),
    TestArrangeActAssertRule(),
  ]

  public static func lint(_ file: SourceFile, rules: [any Rule] = Linter.rules) -> [Violation] {
    rules
      .flatMap { $0.check(file) }
      .filter { !isIgnored($0, in: file) }
      .sorted { ($0.line, $0.column, $0.rule) < ($1.line, $1.column, $1.rule) }
  }

  /// `// swift-style:ignore <rule>` on the line above, or at the end of the line, silences one violation.
  static func isIgnored(_ violation: Violation, in file: SourceFile) -> Bool {
    let marker = "// swift-style:ignore \(violation.rule)"
    let index = violation.line - 1
    if file.lines.indices.contains(index), file.lines[index].contains(marker) {
      return true
    }
    let previous = index - 1
    return file.lines.indices.contains(previous)
      && file.lines[previous].trimmingCharacters(in: .whitespaces).hasPrefix(marker)
  }
}
