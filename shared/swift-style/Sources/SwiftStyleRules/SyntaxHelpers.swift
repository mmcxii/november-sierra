import SwiftSyntax

let viewProtocols: Set<String> = ["View", "ViewModifier"]

extension StructDeclSyntax {
  var conformsToView: Bool {
    inheritedTypeNames.contains { viewProtocols.contains($0) }
  }

  var inheritedTypeNames: [String] {
    (inheritanceClause?.inheritedTypes ?? []).map { inherited in
      String(inherited.type.trimmedDescription.split(separator: ".").last ?? "")
    }
  }
}

extension DeclModifierListSyntax {
  func contains(_ keywords: Keyword...) -> Bool {
    contains { modifier in keywords.contains { modifier.name.tokenKind == .keyword($0) } }
  }

  var isPrivate: Bool { contains(.private, .fileprivate) }
  var isStatic: Bool { contains(.static, .class) }
}

extension AttributeListSyntax {
  var names: [String] {
    compactMap { element in
      element.as(AttributeSyntax.self)?.attributeName.trimmedDescription
    }
  }
}

extension VariableDeclSyntax {
  var name: String? {
    bindings.first?.pattern.as(IdentifierPatternSyntax.self)?.identifier.text
  }

  /// `didSet` and `willSet` observe a stored property; any other accessor makes it computed.
  var isComputed: Bool {
    guard let accessors = bindings.first?.accessorBlock?.accessors else { return false }
    switch accessors {
    case .getter:
      return true
    case .accessors(let list):
      return list.contains { accessor in
        accessor.accessorSpecifier.tokenKind != .keyword(.didSet)
          && accessor.accessorSpecifier.tokenKind != .keyword(.willSet)
      }
    }
  }
}

extension SyntaxProtocol {
  /// The `// MARK:` title written directly above this node, if any. `// MARK: - Title` is accepted too.
  var markTitle: String? {
    for piece in leadingTrivia {
      guard case .lineComment(let text) = piece, text.hasPrefix("// MARK:") else { continue }
      var title = text.dropFirst("// MARK:".count).drop { $0 == " " }
      if title.hasPrefix("-") {
        title = title.dropFirst().drop { $0 == " " }
      }
      return String(title)
    }
    return nil
  }

  /// Pass `crossingClosures: false` to stay within one expression, since a closure starts its own scope.
  func descendants<Node: SyntaxProtocol>(_ type: Node.Type, crossingClosures: Bool = true) -> [Node] {
    var found: [Node] = []
    var queue = Array(children(viewMode: .sourceAccurate))
    while let next = queue.popLast() {
      if let match = next.as(Node.self) {
        found.append(match)
      }
      if crossingClosures || !next.is(ClosureExprSyntax.self) {
        queue.append(contentsOf: next.children(viewMode: .sourceAccurate))
      }
    }
    return found
  }
}

/// The last expression of a getter or function body, which is what a SwiftUI `body` returns.
func resultExpression(of items: CodeBlockItemListSyntax) -> ExprSyntax? {
  guard let last = items.last?.item else { return nil }
  if let expression = last.as(ExprSyntax.self) {
    return expression
  }
  if let returned = last.as(ReturnStmtSyntax.self) {
    return returned.expression
  }
  return nil
}

/// Modifiers in the order they apply: `Text("a").padding().task {}` gives `padding`, then `task`.
func modifierChain(of expression: ExprSyntax) -> [(name: String, node: MemberAccessExprSyntax)] {
  var chain: [(name: String, node: MemberAccessExprSyntax)] = []
  var current = expression
  while let call = current.as(FunctionCallExprSyntax.self),
    let member = call.calledExpression.as(MemberAccessExprSyntax.self),
    let base = member.base
  {
    chain.append((member.declName.baseName.text, member))
    current = base
  }
  return chain.reversed()
}
