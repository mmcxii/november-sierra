import Testing

@testable import SwiftStyleRules

struct ViewEffectsLastRuleTests {
  let rule = ViewEffectsLastRule()

  @Test func acceptsEffectsAtTheEnd() {
    // Arrange
    let source = """
      struct Screen: View {
        var body: some View {
          List {}
            .navigationTitle("Home")
            .sheet(isPresented: .constant(false)) { Text("") }
            .task { await load() }
            .onChange(of: value) { _, _ in }
        }
      }
      """

    // Act
    let violations = lint(source, rule: rule)

    // Assert
    #expect(violations.isEmpty)
  }

  @Test func rejectsModifiersAfterAnEffect() {
    // Arrange
    let source = """
      struct Screen: View {
        var body: some View {
          List {}
            .task { await load() }
            .padding()
        }
      }
      """

    // Act
    let violations = lint(source, rule: rule)

    // Assert
    #expect(violations.count == 1)
    #expect(violations.first?.message.hasPrefix("Move `.padding` above `.task`.") == true)
    #expect(violations.first?.line == 5)
  }

  @Test func checksExplicitReturnsAndViewModifiers() {
    // Arrange
    let source = """
      struct Card: ViewModifier {
        func body(content: Content) -> some View {
          return content.onAppear {}.padding()
        }
      }
      """

    // Act
    let violations = lint(source, rule: rule)

    // Assert
    #expect(violations.count == 1)
  }
}

struct OneViewPerFileRuleTests {
  let rule = OneViewPerFileRule()

  @Test func acceptsAViewWithItsExtensionsAndPrivateHelpers() {
    // Arrange
    let source = """
      import SwiftUI

      struct Row: View {
        var body: some View { Badge() }
      }

      extension Row {
        static let height = 44.0
      }

      private struct Badge: View {
        var body: some View { Text("") }
      }

      #Preview { Row() }
      """

    // Act
    let violations = lint(source, file: "Row.swift", rule: rule)

    // Assert
    #expect(violations.isEmpty)
  }

  @Test func requiresTheFileToBeNamedAfterTheView() {
    // Arrange
    let source = "struct Row: View { var body: some View { Text(\"\") } }"

    // Act
    let violations = lint(source, file: "Rows.swift", rule: rule)

    // Assert
    #expect(violations.map(\.message) == ["Rename this file to Row.swift to match its view."])
  }

  @Test func rejectsSecondViewsAndSharedDeclarations() {
    // Arrange
    let source = """
      struct Row: View { var body: some View { Text("") } }
      struct Cell: View { var body: some View { Text("") } }
      struct Item {}
      extension String {}
      """

    // Act
    let violations = lint(source, file: "Row.swift", rule: rule)

    // Assert
    #expect(violations.map(\.line) == [2, 3, 4])
    #expect(violations.first?.message == "Only one view per file. Move `Cell` to Cell.swift.")
  }

  @Test func letsAModifierKeepItsViewExtension() {
    // Arrange
    let source = """
      struct Card: ViewModifier {
        func body(content: Content) -> some View { content }
      }

      extension View {
        func card() -> some View { modifier(Card()) }
      }
      """

    // Act
    let violations = lint(source, file: "Card.swift", rule: rule)

    // Assert
    #expect(violations.isEmpty)
  }

  @Test func ignoresFilesWithoutViews() {
    // Arrange
    let source = "struct Item {}\nstruct Other {}\nextension String {}"

    // Act
    let violations = lint(source, file: "Models.swift", rule: rule)

    // Assert
    #expect(violations.isEmpty)
  }
}
