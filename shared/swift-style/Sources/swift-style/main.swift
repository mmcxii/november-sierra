import Foundation
import SwiftStyleRules

/// Usage: swift-style [--fix] <file-or-directory>...
/// Prints violations in the compiler's `path:line:column: error:` format so Xcode and CI annotate them inline.
/// `--fix` first rewrites what can be fixed mechanically (view member order and section headers).

let arguments = CommandLine.arguments.dropFirst()
let shouldFix = arguments.contains("--fix")
let paths = arguments.filter { $0 != "--fix" }
guard !paths.isEmpty else {
  FileHandle.standardError.write(Data("Usage: swift-style [--fix] <file-or-directory>...\n".utf8))
  exit(2)
}

let skippedDirectories: Set<String> = [".build", ".swiftpm", "DerivedData", "node_modules"]

func swiftFiles(at path: String) -> [URL] {
  let url = URL(fileURLWithPath: path)
  var isDirectory: ObjCBool = false
  guard FileManager.default.fileExists(atPath: path, isDirectory: &isDirectory) else { return [] }
  guard isDirectory.boolValue else { return url.pathExtension == "swift" ? [url] : [] }
  guard let enumerator = FileManager.default.enumerator(at: url, includingPropertiesForKeys: [.isDirectoryKey]) else {
    return []
  }
  var files: [URL] = []
  for case let file as URL in enumerator {
    if skippedDirectories.contains(file.lastPathComponent) || file.lastPathComponent.hasSuffix(".xcodeproj") {
      enumerator.skipDescendants()
    } else if file.pathExtension == "swift" {
      files.append(file)
    }
  }
  return files
}

var violationCount = 0
for file in paths.flatMap(swiftFiles(at:)).sorted(by: { $0.path < $1.path }) {
  guard var source = try? String(contentsOf: file, encoding: .utf8) else { continue }
  if shouldFix {
    let fixed = ViewSectionsFixer.fix(SourceFile(name: file.lastPathComponent, source: source))
    if fixed != source {
      try fixed.write(to: file, atomically: true, encoding: .utf8)
      source = fixed
    }
  }
  for violation in Linter.lint(SourceFile(name: file.lastPathComponent, source: source)) {
    print("\(file.path):\(violation.line):\(violation.column): error: \(violation.message) [\(violation.rule)]")
    violationCount += 1
  }
}

if violationCount > 0 {
  FileHandle.standardError.write(Data("swift-style found \(violationCount) violation(s).\n".utf8))
  exit(1)
}
