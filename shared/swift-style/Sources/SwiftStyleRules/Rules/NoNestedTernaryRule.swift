import SwiftSyntax

struct NoNestedTernaryRule: Rule {
  let id = "no-nested-ternary"

  func check(_ file: SourceFile) -> [Violation] {
    file.tree.descendants(TernaryExprSyntax.self).compactMap { ternary in
      let branches = [ternary.condition, ternary.thenExpression, ternary.elseExpression]
      let nested = branches.contains { branch in
        branch.is(TernaryExprSyntax.self)
          || !branch.descendants(TernaryExprSyntax.self, crossingClosures: false).isEmpty
      }
      guard nested else { return nil }
      return file.violation(self, "Nested ternaries are hard to read. Use if/else or a switch expression.", at: ternary)
    }
  }
}
