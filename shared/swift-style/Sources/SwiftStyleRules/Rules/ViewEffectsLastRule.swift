import SwiftSyntax

let effectModifiers: Set<String> = [
  "onAppear",
  "onChange",
  "onContinueUserActivity",
  "onDisappear",
  "onOpenURL",
  "onPreferenceChange",
  "onReceive",
  "task",
]

/// SwiftUI's effects are modifiers, so they close out `body` the way effects close out a React component.
struct ViewEffectsLastRule: Rule {
  let id = "view-effects-last"

  func check(_ file: SourceFile) -> [Violation] {
    file.tree.descendants(StructDeclSyntax.self)
      .filter(\.conformsToView)
      .flatMap { view in bodyExpressions(of: view).flatMap { check($0, in: file) } }
  }

  private func bodyExpressions(of view: StructDeclSyntax) -> [ExprSyntax] {
    view.memberBlock.members.compactMap { item -> ExprSyntax? in
      if let variable = item.decl.as(VariableDeclSyntax.self), variable.name == "body",
        case .getter(let items) = variable.bindings.first?.accessorBlock?.accessors
      {
        return resultExpression(of: items)
      }
      if let function = item.decl.as(FunctionDeclSyntax.self), function.name.text == "body",
        let items = function.body?.statements
      {
        return resultExpression(of: items)
      }
      return nil
    }
  }

  private func check(_ body: ExprSyntax, in file: SourceFile) -> [Violation] {
    var firstEffect: String?
    var violations: [Violation] = []
    for modifier in modifierChain(of: body) {
      if effectModifiers.contains(modifier.name) {
        firstEffect = firstEffect ?? modifier.name
      } else if let firstEffect {
        violations.append(
          file.violation(
            self,
            "Move `.\(modifier.name)` above `.\(firstEffect)`. Effect modifiers (.task, .onAppear, .onChange, …) come last on body.",
            at: modifier.node.declName
          )
        )
      }
    }
    return violations
  }
}
