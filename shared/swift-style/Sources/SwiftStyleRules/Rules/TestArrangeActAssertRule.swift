import SwiftSyntax

/// Swift Testing counterpart of the `test-aaa-pattern` ESLint rule: `// Act` and `// Assert` are required,
/// `// Arrange` is optional, and `#expect` only appears under `// Assert`.
struct TestArrangeActAssertRule: Rule {
  enum Section: String {
    case arrange = "Arrange"
    case act = "Act"
    case assert = "Assert"

    var next: [Section] {
      switch self {
      case .arrange: [.act]
      case .act: [.assert]
      case .assert: [.arrange, .act]
      }
    }
  }

  let id = "test-arrange-act-assert"

  func check(_ file: SourceFile) -> [Violation] {
    file.tree.descendants(FunctionDeclSyntax.self)
      .filter { $0.attributes.names.contains("Test") }
      .flatMap { check($0, in: file) }
  }

  private func check(_ test: FunctionDeclSyntax, in file: SourceFile) -> [Violation] {
    guard let body = test.body else { return [] }
    let sections = sectionComments(in: body)
    var violations: [Violation] = []

    for required in [Section.act, .assert] where !sections.contains(where: { $0.section == required }) {
      violations.append(file.violation(self, "Test is missing a `// \(required.rawValue)` section.", at: test.name))
    }

    var previous: Section?
    for (section, position) in sections {
      let allowed = previous?.next ?? [.arrange, .act]
      if !allowed.contains(section) {
        let expected = allowed.map { "`// \($0.rawValue)`" }.joined(separator: " or ")
        violations.append(
          file.violation(self, "`// \(section.rawValue)` can't come here. Expected \(expected).", at: position)
        )
      }
      previous = section
    }

    guard !sections.isEmpty else { return violations }
    for expectation in expectations(in: body) {
      let current = sections.last { $0.position < expectation.positionAfterSkippingLeadingTrivia }?.section
      if current != .assert {
        violations.append(file.violation(self, "`#expect` belongs under `// Assert`.", at: expectation))
      }
    }
    return violations
  }

  private func sectionComments(in body: CodeBlockSyntax) -> [(section: Section, position: AbsolutePosition)] {
    var found: [(section: Section, position: AbsolutePosition)] = []
    for token in body.statements.tokens(viewMode: .sourceAccurate) {
      var position = token.position
      for piece in token.leadingTrivia {
        if case .lineComment(let text) = piece, let section = Section(rawValue: String(text.dropFirst(3))),
          text.hasPrefix("// ")
        {
          found.append((section, position))
        }
        position = position.advanced(by: piece.sourceLength.utf8Length)
      }
    }
    return found
  }

  private func expectations(in body: CodeBlockSyntax) -> [Syntax] {
    let expressions = body.descendants(MacroExpansionExprSyntax.self)
      .filter { $0.macroName.text == "expect" }
      .map(Syntax.init)
    let declarations = body.descendants(MacroExpansionDeclSyntax.self)
      .filter { $0.macroName.text == "expect" }
      .map(Syntax.init)
    return expressions + declarations
  }
}
