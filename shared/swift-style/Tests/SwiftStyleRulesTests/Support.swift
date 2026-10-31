@testable import SwiftStyleRules

func lint(_ source: String, file: String = "Sample.swift", rule: some Rule) -> [Violation] {
  Linter.lint(SourceFile(name: file, source: source), rules: [rule])
}
