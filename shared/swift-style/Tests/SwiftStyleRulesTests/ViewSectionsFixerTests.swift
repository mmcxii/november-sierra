import Testing

@testable import SwiftStyleRules

struct ViewSectionsFixerTests {
  @Test func reordersMembersAndWritesHeaders() {
    // Arrange
    let source = """
      struct Row: View {
        @State private var isOn = false
        let item: Item

        /// Shown in the list.
        var body: some View { Text(title) }
        private var title: String { item.label }
        @Environment(\\.dismiss) private var dismiss
        func tap() {}
      }
      """

    // Act
    let fixed = ViewSectionsFixer.fix(SourceFile(name: "Row.swift", source: source))

    // Assert
    #expect(
      fixed == """
        struct Row: View {
          // MARK: Inputs
          let item: Item

          // MARK: State
          @Environment(\\.dismiss) private var dismiss
          @State private var isOn = false

          // MARK: Variables
          private var title: String { item.label }

          // MARK: Body
          /// Shown in the list.
          var body: some View { Text(title) }

          // MARK: Handlers
          func tap() {}
        }
        """
    )
  }

  @Test func fixedOutputPassesTheRule() {
    // Arrange
    let source = """
      struct Row: View {
        // MARK: Body
        var body: some View { Text("") }
        // MARK: State
        @State private var isOn = false
        // MARK: Handlers
        func tap() {}
      }
      """

    // Act
    let fixed = ViewSectionsFixer.fix(SourceFile(name: "Row.swift", source: source))

    // Assert
    #expect(Linter.lint(SourceFile(name: "Row.swift", source: fixed), rules: [ViewSectionsRule()]).isEmpty)
  }

  @Test func leavesSimpleViewsAlone() {
    // Arrange
    let source = """
      struct Label: View {
        let text: String

        var body: some View { Text(text) }
      }
      """

    // Act
    let fixed = ViewSectionsFixer.fix(SourceFile(name: "Label.swift", source: source))

    // Assert
    #expect(fixed == source)
  }
}
