import SwiftSyntax

/// swift-format already rejects `!` unwraps and `try!`; this closes the remaining crash-on-nil hole.
struct NoForceCastRule: Rule {
  let id = "no-force-cast"

  func check(_ file: SourceFile) -> [Violation] {
    file.tree.descendants(AsExprSyntax.self)
      .filter { $0.questionOrExclamationMark?.tokenKind == .exclamationMark }
      .map { file.violation(self, "Avoid `as!`. Use `as?` with a guard, or fix the type.", at: $0.asKeyword) }
  }
}
