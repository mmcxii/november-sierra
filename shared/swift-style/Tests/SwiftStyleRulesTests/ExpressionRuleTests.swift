import Testing

@testable import SwiftStyleRules

struct NoNestedTernaryRuleTests {
  let rule = NoNestedTernaryRule()

  @Test func allowsASingleTernary() {
    // Arrange
    let source = "let size = isLarge ? 31 : 22"

    // Act
    let violations = lint(source, rule: rule)

    // Assert
    #expect(violations.isEmpty)
  }

  @Test func rejectsChainedAndParenthesizedNesting() {
    // Arrange
    let source = """
      let a = x ? 1 : y ? 2 : 3
      let b = x ? (y ? 1 : 2) : 3
      """

    // Act
    let violations = lint(source, rule: rule)

    // Assert
    #expect(violations.map(\.line) == [1, 2])
  }

  @Test func allowsTernariesInsideClosuresWithinATernary() {
    // Arrange
    let source = "let a = x ? items.map { $0 ? 1 : 2 } : []"

    // Act
    let violations = lint(source, rule: rule)

    // Assert
    #expect(violations.isEmpty)
  }
}

struct NoForceCastRuleTests {
  let rule = NoForceCastRule()

  @Test func rejectsForceCastsOnly() {
    // Arrange
    let source = """
      let a = value as! String
      let b = value as? String
      let c = value as String
      """

    // Act
    let violations = lint(source, rule: rule)

    // Assert
    #expect(violations.map(\.line) == [1])
  }
}

struct IgnoreCommentTests {
  @Test func ignoreCommentsSilenceOneRuleOnOneLine() {
    // Arrange
    let source = """
      // swift-style:ignore no-force-cast
      let a = value as! String
      let b = value as! String  // swift-style:ignore no-force-cast
      let c = value as! String  // swift-style:ignore no-nested-ternary
      """

    // Act
    let violations = lint(source, rule: NoForceCastRule())

    // Assert
    #expect(violations.map(\.line) == [4])
  }
}
