import SwiftSyntax

/// Members of a SwiftUI view, in the order they must appear. Mirrors the React section order
/// (State → Refs → Variables → Handlers → Effects); effects are `body` modifiers in SwiftUI.
enum ViewSection: Int, CaseIterable, Comparable {
  case types
  case inputs
  case state
  case variables
  case body
  case handlers

  static func < (lhs: ViewSection, rhs: ViewSection) -> Bool { lhs.rawValue < rhs.rawValue }

  var title: String {
    switch self {
    case .types: "Types"
    case .inputs: "Inputs"
    case .state: "State"
    case .variables: "Variables"
    case .body: "Body"
    case .handlers: "Handlers"
    }
  }

  static let order = allCases.map(\.title).joined(separator: ", ")
}

/// Within State, sources further from the view come first, so a reader meets dependencies before local UI state.
enum StateSource: Int, Comparable {
  case environment
  case storage
  case local

  static func < (lhs: StateSource, rhs: StateSource) -> Bool { lhs.rawValue < rhs.rawValue }

  init?(wrapper: String) {
    switch wrapper {
    case "Environment", "EnvironmentObject": self = .environment
    case "Query", "FetchRequest", "SectionedFetchRequest", "AppStorage", "SceneStorage", "ObservedObject":
      self = .storage
    case "State", "StateObject", "FocusState", "GestureState", "Namespace", "ScaledMetric", "AccessibilityFocusState":
      self = .local
    default: return nil
    }
  }

  var description: String {
    switch self {
    case .environment: "@Environment values"
    case .storage: "stored and queried values"
    case .local: "local @State"
    }
  }
}

struct ViewMember {
  var section: ViewSection
  var source: StateSource?
  var syntax: MemberBlockItemSyntax

  init?(_ item: MemberBlockItemSyntax) {
    syntax = item
    let decl = item.decl
    if decl.is(StructDeclSyntax.self) || decl.is(EnumDeclSyntax.self) || decl.is(ClassDeclSyntax.self)
      || decl.is(TypeAliasDeclSyntax.self) || decl.is(ActorDeclSyntax.self)
    {
      section = .types
    } else if decl.is(InitializerDeclSyntax.self) {
      section = .inputs
    } else if let function = decl.as(FunctionDeclSyntax.self) {
      section = function.name.text == "body" && !function.modifiers.isStatic ? .body : .handlers
    } else if decl.is(SubscriptDeclSyntax.self) {
      section = .handlers
    } else if let variable = decl.as(VariableDeclSyntax.self) {
      let wrappers = variable.attributes.names
      if variable.name == "body", !variable.modifiers.isStatic {
        section = .body
      } else if variable.modifiers.isStatic || variable.isComputed {
        section = .variables
      } else if let source = wrappers.lazy.compactMap(StateSource.init(wrapper:)).first {
        section = .state
        self.source = source
      } else if wrappers.contains("Binding") || wrappers.contains("Bindable") || !variable.modifiers.isPrivate {
        section = .inputs
      } else {
        section = .variables
      }
    } else {
      return nil
    }
  }
}

/// Keeps every view laid out the same way: Types, Inputs, State, Variables, Body, Handlers, each under a
/// `// MARK:` header once the view has state or handlers.
struct ViewSectionsRule: Rule {
  let id = "view-sections"

  func check(_ file: SourceFile) -> [Violation] {
    file.tree.descendants(StructDeclSyntax.self)
      .filter(\.conformsToView)
      .flatMap { check($0, in: file) }
  }

  private func check(_ view: StructDeclSyntax, in file: SourceFile) -> [Violation] {
    let members = view.memberBlock.members.compactMap(ViewMember.init)
    let needsHeaders = members.contains { $0.section == .state || $0.section == .handlers }
    var violations: [Violation] = []
    var furthest: ViewSection?
    var furthestSource: StateSource?
    var previous: ViewSection?

    for member in members {
      let decl = member.syntax.decl
      if let furthest, member.section < furthest {
        violations.append(
          file.violation(
            self,
            "\(member.section.title) members must come before \(furthest.title). Expected order: \(ViewSection.order).",
            at: decl
          )
        )
      }
      if let source = member.source, let furthestSource, source < furthestSource {
        violations.append(
          file.violation(
            self,
            "Order State from external to local: \(source.description) come before \(furthestSource.description).",
            at: decl
          )
        )
      }

      let startsSection = member.section != previous
      switch (member.syntax.markTitle, startsSection) {
      case (let title?, true) where title != member.section.title:
        violations.append(
          file.violation(
            self, "This member belongs under `// MARK: \(member.section.title)`, not `\(title)`.", at: decl)
        )
      case (let title?, false):
        violations.append(
          file.violation(
            self,
            "`// MARK: \(title)` must sit above the first member of its section. Remove it here.",
            at: decl
          )
        )
      case (nil, true) where needsHeaders:
        violations.append(
          file.violation(
            self, "Add `// MARK: \(member.section.title)` above the first \(member.section.title) member.", at: decl)
        )
      default:
        break
      }

      furthest = max(furthest ?? member.section, member.section)
      if let source = member.source {
        furthestSource = max(furthestSource ?? source, source)
      }
      previous = member.section
    }
    return violations
  }
}
