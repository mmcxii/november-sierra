import Testing

@testable import SwiftStyleRules

struct TestArrangeActAssertRuleTests {
  let rule = TestArrangeActAssertRule()

  @Test func acceptsArrangeActAssert() {
    // Arrange
    let source = """
      @Test func adds() throws {
        // Arrange
        let value = try #require(Int("1"))

        // Act
        let sum = value + 1

        // Assert
        #expect(sum == 2)
      }
      """

    // Act
    let violations = lint(source, rule: rule)

    // Assert
    #expect(violations.isEmpty)
  }

  @Test func allowsRepeatedActAssertPairs() {
    // Arrange
    let source = """
      @Test func toggles() {
        // Act
        let first = toggle()

        // Assert
        #expect(first)

        // Act
        let second = toggle()

        // Assert
        #expect(!second)
      }
      """

    // Act
    let violations = lint(source, rule: rule)

    // Assert
    #expect(violations.isEmpty)
  }

  @Test func requiresActAndAssert() {
    // Arrange
    let source = """
      @Test func adds() {
        #expect(1 + 1 == 2)
      }
      """

    // Act
    let messages = lint(source, rule: rule).map(\.message)

    // Assert
    #expect(messages == ["Test is missing a `// Act` section.", "Test is missing a `// Assert` section."])
  }

  @Test func rejectsExpectationsOutsideAssertAndBadOrder() {
    // Arrange
    let source = """
      @Test func adds() {
        // Act
        let sum = 1 + 1
        #expect(sum == 2)

        // Arrange
        let other = 3

        // Assert
        #expect(other == 3)
      }
      """

    // Act
    let messages = lint(source, rule: rule).map(\.message)

    // Assert
    #expect(messages.contains("`#expect` belongs under `// Assert`."))
    #expect(messages.contains("`// Arrange` can't come here. Expected `// Assert`."))
  }

  @Test func ignoresFunctionsThatAreNotTests() {
    // Arrange
    let source = "func helper() { #expect(true) }"

    // Act
    let violations = lint(source, rule: rule)

    // Assert
    #expect(violations.isEmpty)
  }
}
