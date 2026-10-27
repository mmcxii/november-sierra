import SwiftSyntax

/// Rewrites views into the `view-sections` layout: members sorted by section (stable), State sorted from
/// external to local, and `// MARK:` headers rebuilt above the first member of each section.
public enum ViewSectionsFixer {
  public static func fix(_ file: SourceFile) -> String {
    Rewriter(viewMode: .sourceAccurate).rewrite(file.tree).description
  }

  private final class Rewriter: SyntaxRewriter {
    override func visit(_ node: StructDeclSyntax) -> DeclSyntax {
      let visited = super.visit(node)
      guard let view = visited.as(StructDeclSyntax.self), view.conformsToView else { return visited }
      return DeclSyntax(view.with(\.memberBlock.members, reorder(view.memberBlock.members)))
    }

    private func reorder(_ items: MemberBlockItemListSyntax) -> MemberBlockItemListSyntax {
      let classified = items.enumerated().map { index, item in (index: index, item: item, member: ViewMember(item)) }
      // Members the rule doesn't classify (like `#if` blocks) stay where they are.
      guard classified.allSatisfy({ $0.member != nil }) else { return items }
      let members = classified.compactMap { entry in entry.member.map { (index: entry.index, member: $0) } }
      let sorted = members.sorted { lhs, rhs in
        let left = (lhs.member.section.rawValue, lhs.member.source?.rawValue ?? 0, lhs.index)
        let right = (rhs.member.section.rawValue, rhs.member.source?.rawValue ?? 0, rhs.index)
        return left < right
      }
      let needsHeaders = members.contains { $0.member.section == .state || $0.member.section == .handlers }

      var previous: ViewSection?
      let rebuilt = sorted.enumerated().map { position, entry -> MemberBlockItemSyntax in
        let section = entry.member.section
        let startsSection = section != previous
        previous = section
        let header = needsHeaders && startsSection ? section.title : nil
        let blankLineBefore = position > 0 && (startsSection || hasBlankLine(entry.member.syntax.leadingTrivia))
        return entry.member.syntax.with(
          \.leadingTrivia,
          rebuiltTrivia(entry.member.syntax.leadingTrivia, header: header, blankLineBefore: blankLineBefore)
        )
      }
      return MemberBlockItemListSyntax(rebuilt)
    }

    private func hasBlankLine(_ trivia: Trivia) -> Bool {
      trivia.prefix { $0.isWhitespace }.reduce(0) { count, piece in
        if case .newlines(let lines) = piece { return count + lines }
        return count
      } > 1
    }

    /// Keeps doc comments and attributes' trivia, drops old `// MARK:` lines, and normalizes spacing.
    private func rebuiltTrivia(_ trivia: Trivia, header: String?, blankLineBefore: Bool) -> Trivia {
      var pieces = Array(trivia)
      while let mark = pieces.firstIndex(where: { piece in
        if case .lineComment(let text) = piece { return text.hasPrefix("// MARK:") }
        return false
      }) {
        var end = mark + 1
        while end < pieces.count, pieces[end].isWhitespace { end += 1 }
        pieces.removeSubrange(mark..<end)
      }
      let leadingWhitespace = pieces.prefix { $0.isWhitespace }
      let indentation = leadingWhitespace.reversed().prefix { piece in
        if case .spaces = piece { return true }
        if case .tabs = piece { return true }
        return false
      }.reversed()
      let rest = pieces.dropFirst(leadingWhitespace.count)

      var result: [TriviaPiece] = [.newlines(blankLineBefore ? 2 : 1)]
      result += indentation
      if let header {
        result.append(.lineComment("// MARK: \(header)"))
        result.append(.newlines(1))
        result += indentation
      }
      result += rest
      return Trivia(pieces: result)
    }
  }
}
