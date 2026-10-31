import Testing

@testable import SwiftStyleRules

struct ViewSectionsRuleTests {
  let rule = ViewSectionsRule()

  @Test func acceptsTheCanonicalLayout() {
    // Arrange
    let source = """
      struct Row: View {
        // MARK: Types
        enum Style { case plain }

        // MARK: Inputs
        let item: Item
        @Binding var isEditing: Bool

        // MARK: State
        @Environment(AppModel.self) private var model
        @AppStorage("compact") private var isCompact = false
        @State private var isRenaming = false

        // MARK: Variables
        private let spacing = 4.0
        private var title: String { item.label }

        // MARK: Body
        var body: some View { Text(title) }

        // MARK: Handlers
        private func rename() {}
      }
      """

    // Act
    let violations = lint(source, rule: rule)

    // Assert
    #expect(violations.isEmpty)
  }

  @Test func simpleViewsDoNotNeedHeaders() {
    // Arrange
    let source = """
      struct Label: View {
        let text: String
        var body: some View { Text(text) }
      }
      """

    // Act
    let violations = lint(source, rule: rule)

    // Assert
    #expect(violations.isEmpty)
  }

  @Test func requiresHeadersOnceAViewHasState() {
    // Arrange
    let source = """
      struct Toggle: View {
        @State private var isOn = false
        var body: some View { Text("") }
      }
      """

    // Act
    let violations = lint(source, rule: rule)

    // Assert
    #expect(violations.map(\.message).contains { $0.contains("Add `// MARK: State`") })
    #expect(violations.map(\.message).contains { $0.contains("Add `// MARK: Body`") })
  }

  @Test func rejectsOutOfOrderSections() {
    // Arrange
    let source = """
      struct Row: View {
        var body: some View { Text("") }
        let item: Item
      }
      """

    // Act
    let violations = lint(source, rule: rule)

    // Assert
    #expect(violations.count == 1)
    #expect(violations.first?.message.hasPrefix("Inputs members must come before Body") == true)
    #expect(violations.first?.line == 3)
  }

  @Test func ordersStateFromExternalToLocal() {
    // Arrange
    let source = """
      struct Row: View {
        // MARK: State
        @State private var isOn = false
        @Environment(\\.dismiss) private var dismiss

        // MARK: Body
        var body: some View { Text("") }
      }
      """

    // Act
    let violations = lint(source, rule: rule)

    // Assert
    #expect(
      violations.map(\.message) == [
        "Order State from external to local: @Environment values come before local @State."
      ])
  }

  @Test func rejectsWrongAndMisplacedHeaders() {
    // Arrange
    let source = """
      struct Row: View {
        // MARK: Props
        let item: Item
        // MARK: Inputs
        let index: Int

        // MARK: Body
        var body: some View { Text("") }

        // MARK: Handlers
        func tap() {}
      }
      """

    // Act
    let messages = lint(source, rule: rule).map(\.message)

    // Assert
    #expect(messages.contains("This member belongs under `// MARK: Inputs`, not `Props`."))
    #expect(messages.contains("`// MARK: Inputs` must sit above the first member of its section. Remove it here."))
  }

  @Test func treatsViewModifierBodyAsBody() {
    // Arrange
    let source = """
      struct Card: ViewModifier {
        // MARK: State
        @Environment(\\.colorScheme) private var colorScheme

        // MARK: Body
        func body(content: Content) -> some View { content }
      }
      """

    // Act
    let violations = lint(source, rule: rule)

    // Assert
    #expect(violations.isEmpty)
  }

  @Test func ignoresTypesThatAreNotViews() {
    // Arrange
    let source = """
      struct Model {
        func load() {}
        let value: Int
      }
      """

    // Act
    let violations = lint(source, rule: rule)

    // Assert
    #expect(violations.isEmpty)
  }
}
