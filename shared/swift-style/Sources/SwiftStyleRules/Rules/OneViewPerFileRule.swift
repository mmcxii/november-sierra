import SwiftSyntax

/// One view per file, named after the file. Private helpers can stay; anything shared moves to its own file.
struct OneViewPerFileRule: Rule {
  let id = "one-view-per-file"

  func check(_ file: SourceFile) -> [Violation] {
    let declarations = file.tree.statements.compactMap { $0.item.as(DeclSyntax.self) }
    let views = declarations.compactMap { $0.as(StructDeclSyntax.self) }
      .filter { $0.conformsToView && !$0.modifiers.isPrivate }
    guard let view = views.first else { return [] }
    let name = view.name.text
    var violations: [Violation] = []

    if file.name != "\(name).swift" {
      violations.append(file.violation(self, "Rename this file to \(name).swift to match its view.", at: view.name))
    }
    for extra in views.dropFirst() {
      violations.append(
        file.violation(
          self, "Only one view per file. Move `\(extra.name.text)` to \(extra.name.text).swift.", at: extra.name)
      )
    }
    let isModifier = view.inheritedTypeNames.contains("ViewModifier")
    for declaration in declarations where !isAllowed(declaration, alongside: name, isModifier: isModifier) {
      violations.append(
        file.violation(
          self,
          "View files hold the view, its extensions, previews, and private helpers. Move this to its own file.",
          at: declaration
        )
      )
    }
    return violations
  }

  private func isAllowed(_ declaration: DeclSyntax, alongside view: String, isModifier: Bool) -> Bool {
    if declaration.is(ImportDeclSyntax.self) || declaration.is(MacroExpansionDeclSyntax.self)
      || declaration.is(IfConfigDeclSyntax.self)
    {
      return true
    }
    if let structure = declaration.as(StructDeclSyntax.self) {
      return structure.conformsToView || structure.modifiers.isPrivate
    }
    if let extensionDecl = declaration.as(ExtensionDeclSyntax.self) {
      let extended = extensionDecl.extendedType.trimmedDescription
      // A modifier's `View` convenience method (`.themeAppearance(_:)`) belongs next to the modifier.
      return extended == view || (isModifier && extended == "View")
    }
    let modifiers =
      declaration.as(EnumDeclSyntax.self)?.modifiers
      ?? declaration.as(ClassDeclSyntax.self)?.modifiers
      ?? declaration.as(FunctionDeclSyntax.self)?.modifiers
      ?? declaration.as(VariableDeclSyntax.self)?.modifiers
      ?? declaration.as(TypeAliasDeclSyntax.self)?.modifiers
    return modifiers?.isPrivate ?? false
  }
}
