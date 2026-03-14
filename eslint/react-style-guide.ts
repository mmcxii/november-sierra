import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import * as path from "node:path";
import ts from "typescript";

const createRule = ESLintUtils.RuleCreator(() => "https://github.com/novembersierra/anchr");

const SECTION_NAMES = ["State", "Refs", "Variables", "Handlers", "Effects"] as const;
type SectionName = (typeof SECTION_NAMES)[number];

const REACT_HOOK_SECTIONS: Record<string, SectionName> = {
  useCallback: "Handlers",
  useContext: "State",
  useEffect: "Effects",
  useInsertionEffect: "Effects",
  useLayoutEffect: "Effects",
  useMemo: "Variables",
  useRef: "Refs",
  useState: "State",
  useTranslation: "State",
};

type Section = {
  comment: TSESTree.Comment;
  endIndex: number;
  name: SectionName;
  startIndex: number;
  statements: TSESTree.Statement[];
};

function isSectionComment(comment: TSESTree.Comment): comment is TSESTree.Comment & { value: string } {
  return comment.type === "Line" && SECTION_NAMES.some((name) => comment.value === `* ${name}`);
}

function getSectionName(comment: TSESTree.Comment): SectionName {
  return comment.value.replace("* ", "") as SectionName;
}

/**
 * Get the function body statements for a component or hook.
 */
function getFunctionBody(
  node: TSESTree.ExportNamedDeclaration,
): null | { body: TSESTree.Statement[]; bodyNode: TSESTree.BlockStatement } {
  const declaration = node.declaration;
  if (declaration == null) {
    return null;
  }

  // Hook: export function useFoo() { ... }
  if (declaration.type === "FunctionDeclaration" && declaration.body) {
    return { body: declaration.body.body, bodyNode: declaration.body };
  }

  // Component: export const Foo: React.FC<...> = (props) => { ... }
  if (declaration.type === "VariableDeclaration") {
    const declarator = declaration.declarations[0];
    if (declarator?.init?.type === "ArrowFunctionExpression" && declarator.init.body.type === "BlockStatement") {
      return { body: declarator.init.body.body, bodyNode: declarator.init.body };
    }
  }

  return null;
}

/**
 * Check if a node is a React.FC type annotation.
 */
function isReactFC(annotation: undefined | TSESTree.TypeNode): annotation is TSESTree.TSTypeReference {
  if (annotation?.type !== "TSTypeReference") {
    return false;
  }
  const typeName = annotation.typeName;
  // React.FC
  if (
    typeName.type === "TSQualifiedName" &&
    typeName.left.type === "Identifier" &&
    typeName.left.name === "React" &&
    typeName.right.type === "Identifier" &&
    typeName.right.name === "FC"
  ) {
    return true;
  }
  return false;
}

/**
 * Check if a statement is an if-statement containing a return.
 */
function isEarlyReturnStatement(stmt: TSESTree.Statement): boolean {
  if (stmt.type !== "IfStatement") {
    return false;
  }
  return containsReturn(stmt);
}

function containsReturn(node: TSESTree.Node): boolean {
  if (node.type === "ReturnStatement") {
    return true;
  }
  if (node.type === "IfStatement") {
    if (node.consequent && containsReturn(node.consequent)) {
      return true;
    }
    if (node.alternate != null && containsReturn(node.alternate)) {
      return true;
    }
  }
  if (node.type === "BlockStatement") {
    return node.body.some(containsReturn);
  }
  return false;
}

/**
 * Extract callee info from a call expression.
 */
function getCalleeInfo(callExpr: TSESTree.CallExpression): null | {
  isHook: boolean;
  isMemberExpression: boolean;
  name: string;
} {
  const callee = callExpr.callee;

  // React.useEffect(), React.useState(), etc.
  if (
    callee.type === "MemberExpression" &&
    callee.object.type === "Identifier" &&
    callee.object.name === "React" &&
    callee.property.type === "Identifier"
  ) {
    return {
      isHook: /^use[A-Z]/.test(callee.property.name),
      isMemberExpression: true,
      name: callee.property.name,
    };
  }

  // useEffect(), useState(), etc.
  if (callee.type === "Identifier") {
    return {
      isHook: /^use[A-Z]/.test(callee.name),
      isMemberExpression: false,
      name: callee.name,
    };
  }

  return null;
}

/**
 * Classify a statement into the section it belongs to.
 * Returns null for statements we can't confidently classify (to avoid false positives).
 */
function classifyStatement(stmt: TSESTree.Statement): null | { description: string; section: SectionName } {
  // ExpressionStatement with a call expression: e.g., React.useEffect(() => {}, []);
  if (stmt.type === "ExpressionStatement" && stmt.expression.type === "CallExpression") {
    const info = getCalleeInfo(stmt.expression);
    if (info == null) {
      return null;
    }
    if (info.isHook) {
      const mapped = REACT_HOOK_SECTIONS[info.name];
      if (mapped != null) {
        return { description: `${info.isMemberExpression ? "React." : ""}${info.name}()`, section: mapped };
      }
      // Unmapped bare hook call — almost certainly an effect
      return { description: `${info.isMemberExpression ? "React." : ""}${info.name}()`, section: "Effects" };
    }
    return null;
  }

  // VariableDeclaration: const x = ...
  if (stmt.type === "VariableDeclaration" && stmt.declarations.length > 0) {
    const init = stmt.declarations[0].init;
    if (init == null) {
      return null;
    }

    // Call expression on the right: const ref = React.useRef(null)
    if (init.type === "CallExpression") {
      const info = getCalleeInfo(init);
      if (info == null) {
        return null;
      }
      if (info.isHook) {
        const mapped = REACT_HOOK_SECTIONS[info.name];
        if (mapped != null) {
          return { description: `${info.isMemberExpression ? "React." : ""}${info.name}()`, section: mapped };
        }
        // Custom hook ending in Ref → Refs
        if (/Ref$/.test(info.name)) {
          return { description: `${info.isMemberExpression ? "React." : ""}${info.name}()`, section: "Refs" };
        }
        return null;
      }
      // Non-hook call: e.g., const result = someFunction()
      return { description: "Non-hook call expression", section: "Variables" };
    }

    // Arrow function or function expression: const onClick = () => {}
    if (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression") {
      return { description: "Function assignment", section: "Handlers" };
    }

    // Anything else (binary, literal, member access, etc.): const doubled = count * 2
    return { description: "Derived value", section: "Variables" };
  }

  return null;
}

/**
 * Build sections from comments within a function body.
 */
function buildSections(
  comments: TSESTree.Comment[],
  bodyStatements: TSESTree.Statement[],
  bodyNode: TSESTree.BlockStatement,
): Section[] {
  const sectionComments = comments
    .filter((c) => isSectionComment(c) && isWithinRange(c, bodyNode))
    .sort((a, b) => a.loc.start.line - b.loc.start.line);

  if (sectionComments.length === 0) {
    return [];
  }

  const sections: Section[] = [];

  for (let i = 0; i < sectionComments.length; i++) {
    const comment = sectionComments[i];
    const nextComment = sectionComments[i + 1];
    const commentLine = comment.loc.start.line;
    const nextCommentLine = nextComment ? nextComment.loc.start.line : Infinity;

    const stmts = bodyStatements.filter((s) => {
      const stmtLine = s.loc.start.line;
      if (stmtLine <= commentLine || stmtLine >= nextCommentLine) {
        return false;
      }
      // Exclude early returns (if-statements with returns) and the final return
      if (isEarlyReturnStatement(s) || s.type === "ReturnStatement") {
        return false;
      }
      return true;
    });

    sections.push({
      comment,
      endIndex: i,
      name: getSectionName(comment),
      startIndex: i,
      statements: stmts,
    });
  }

  return sections;
}

function isWithinRange(comment: TSESTree.Comment, body: TSESTree.BlockStatement): boolean {
  return comment.loc.start.line > body.loc.start.line && comment.loc.end.line < body.loc.end.line;
}

export const reactStyleGuide = createRule({
  defaultOptions: [],
  meta: {
    docs: {
      description: "Enforce React component and hook style guide conventions",
    },
    fixable: "code",
    messages: {
      componentDeclaration:
        "Components must use arrow function syntax: `export const {{ name }}: React.FC = (props) => { ... }`.",
      destructuredParams:
        "Destructuring params in the signature is not allowed. Use a named parameter and destructure inside the body.",
      earlyReturn: "Conditional returns must come after all section blocks, not before or between them.",
      emptySection: "Section '//* {{ name }}' is empty. Remove the section header.",
      fileNaming: "Component and hook files must be named index.ts or index.tsx inside a kebab-cased folder.",
      hookDeclaration: "Hooks must use function declarations: `export function {{ name }}() { ... }`.",
      hookReturnType: "Hooks returning non-scalar types must have an explicit return type annotation.",
      inlineProps: "Inline prop types are not allowed. Extract to a named type above the component.",
      missingBlankLine: "A blank line is required before this {{ kind }}.",
      missingFCAnnotation: "Components must be typed with React.FC: `export const {{ name }}: React.FC = ...`.",
      propsDestructuringLocation: "Props must be destructured on the first line of the component body.",
      propsTypeNaming: "Props type must be named {{ expected }}, not {{ actual }}.",
      reactNamespaceImport:
        'Import React as a namespace: `import * as React from "react"`. Access members via `React.*`.',
      sectionAssignment: "{{ description }} belongs in the {{ expected }} section, not {{ actual }}.",
      sectionOrder: "Sections are out of order. Expected: {{ expected }}.",
    },
    schema: [],
    type: "suggestion",
  },
  name: "react-style-guide",

  create(context) {
    let fileNamingReported = false;

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        if (node.source.value !== "react") {
          return;
        }

        // Skip if it's already a namespace import: import * as React from "react"
        if (node.specifiers.length === 1 && node.specifiers[0].type === "ImportNamespaceSpecifier") {
          return;
        }

        // Has named or default specifiers — flag it
        const sourceCode = context.sourceCode;
        const programNode = sourceCode.ast;

        // Check if a namespace import already exists elsewhere in the file
        const hasExistingNamespace = programNode.body.some(
          (stmt) =>
            stmt.type === "ImportDeclaration" &&
            stmt.source.value === "react" &&
            stmt !== node &&
            stmt.specifiers.length === 1 &&
            stmt.specifiers[0].type === "ImportNamespaceSpecifier",
        );

        // Collect all imported names and their references
        const importedVars: { imported: string; references: (TSESTree.Identifier | TSESTree.JSXIdentifier)[] }[] = [];

        for (const specifier of node.specifiers) {
          const declaredVars = sourceCode.getDeclaredVariables(specifier);
          for (const v of declaredVars) {
            let importedName: string;
            if (specifier.type === "ImportSpecifier") {
              importedName =
                specifier.imported.type === "Identifier" ? specifier.imported.name : specifier.imported.value;
            } else {
              // ImportDefaultSpecifier — use "default" conceptually but
              // when replacing we'll use React.default which isn't right.
              // Default import of React is just the namespace itself.
              importedName = "";
            }

            const refs = v.references
              .filter((ref) => ref.identifier.range[0] !== specifier.local.range[0])
              .map((ref) => ref.identifier);

            importedVars.push({ imported: importedName, references: refs });
          }
        }

        context.report({
          fix(fixer) {
            const fixes: ReturnType<typeof fixer.replaceText>[] = [];

            if (hasExistingNamespace) {
              // Remove this import statement entirely
              const nextToken = sourceCode.getTokenAfter(node);
              const endRange =
                nextToken != null && nextToken.loc.start.line > node.loc.end.line
                  ? sourceCode.getIndexFromLoc({ column: 0, line: node.loc.end.line + 1 })
                  : node.range[1];
              fixes.push(fixer.removeRange([node.range[0], endRange]));
            } else {
              // Replace with namespace import
              fixes.push(fixer.replaceText(node, `import * as React from "react";`));
            }

            // Replace all references with React.name
            for (const { imported, references } of importedVars) {
              for (const ref of references) {
                if (imported === "") {
                  // Default import — already named React, no change needed
                  continue;
                }
                fixes.push(fixer.replaceText(ref, `React.${imported}`));
              }
            }

            return fixes;
          },
          messageId: "reactNamespaceImport",
          node,
        });
      },

      Program(programNode: TSESTree.Program) {
        const sourceCode = context.sourceCode;

        for (const stmt of programNode.body) {
          if (stmt.type !== "ExportNamedDeclaration" || stmt.declaration == null) {
            continue;
          }

          const declaration = stmt.declaration;

          // Determine if this is a component or hook
          let isComponent = false;
          let isHook = false;
          let componentName: null | string = null;

          if (
            declaration.type === "VariableDeclaration" &&
            declaration.declarations[0]?.id.type === "Identifier" &&
            declaration.declarations[0]?.init?.type === "ArrowFunctionExpression"
          ) {
            const declarator = declaration.declarations[0];
            if (declarator.id.type === "Identifier") {
              const typeAnnotation = declarator.id.typeAnnotation?.typeAnnotation;
              if (isReactFC(typeAnnotation)) {
                isComponent = true;
                componentName = declarator.id.name;
              }
            }
          }

          if (declaration.type === "FunctionDeclaration" && declaration.id && /^use[A-Z]/.test(declaration.id.name)) {
            isHook = true;
          }

          // --- componentDeclaration: ban function declaration components ---
          if (
            declaration.type === "FunctionDeclaration" &&
            declaration.id != null &&
            /^[A-Z]/.test(declaration.id.name) &&
            !/^use[A-Z]/.test(declaration.id.name) &&
            !/^[A-Z]+$/.test(declaration.id.name) // skip all-caps (e.g. POST, GET route handlers)
          ) {
            context.report({
              data: { name: declaration.id.name },
              messageId: "componentDeclaration",
              node: stmt,
            });
            continue;
          }

          // --- missingFCAnnotation: PascalCase arrow functions must use React.FC ---
          if (
            declaration.type === "VariableDeclaration" &&
            declaration.declarations[0]?.id.type === "Identifier" &&
            declaration.declarations[0]?.init?.type === "ArrowFunctionExpression" &&
            /^[A-Z]/.test(declaration.declarations[0].id.name) &&
            !/^use[A-Z]/.test(declaration.declarations[0].id.name) &&
            !/^[A-Z]+$/.test(declaration.declarations[0].id.name) &&
            context.filename.endsWith(".tsx") &&
            !isComponent
          ) {
            context.report({
              data: { name: declaration.declarations[0].id.name },
              messageId: "missingFCAnnotation",
              node: stmt,
            });
            continue;
          }

          // --- hookReturnType: hooks returning non-scalar types must have explicit return type ---
          if (isHook) {
            const funcDecl = declaration as TSESTree.FunctionDeclaration;
            if (funcDecl.returnType == null) {
              const parserServices = context.sourceCode.parserServices;
              if (parserServices?.program != null && parserServices.esTreeNodeToTSNodeMap != null) {
                const checker = parserServices.program.getTypeChecker();
                const tsNode = parserServices.esTreeNodeToTSNodeMap.get(funcDecl);
                const signature = checker.getSignaturesOfType(
                  checker.getTypeAtLocation(tsNode),
                  ts.SignatureKind.Call,
                )[0];
                if (signature != null) {
                  const returnType = checker.getReturnTypeOfSignature(signature);
                  if (
                    (returnType.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) === 0 &&
                    !isScalarType(returnType)
                  ) {
                    context.report({
                      messageId: "hookReturnType",
                      node: funcDecl.id ?? funcDecl,
                    });
                  }
                }
              }
            }
          }

          // --- hookDeclaration: hooks must use function declarations ---
          if (
            declaration.type === "VariableDeclaration" &&
            declaration.declarations[0]?.id.type === "Identifier" &&
            /^use[A-Z]/.test(declaration.declarations[0].id.name) &&
            declaration.declarations[0].init != null &&
            (declaration.declarations[0].init.type === "ArrowFunctionExpression" ||
              declaration.declarations[0].init.type === "FunctionExpression")
          ) {
            const declarator = declaration.declarations[0];
            const hookName = (declarator.id as TSESTree.Identifier).name;
            const funcExpr = declarator.init as TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;
            const paramsText = funcExpr.params.map((p) => sourceCode.getText(p)).join(", ");
            const returnTypeText = funcExpr.returnType != null ? sourceCode.getText(funcExpr.returnType) : "";
            let bodyText: string;
            if (funcExpr.body.type === "BlockStatement") {
              bodyText = sourceCode.getText(funcExpr.body);
            } else {
              bodyText = `{ return ${sourceCode.getText(funcExpr.body)}; }`;
            }

            context.report({
              data: { name: hookName },
              fix(fixer) {
                return fixer.replaceText(
                  stmt,
                  `export function ${hookName}(${paramsText})${returnTypeText} ${bodyText}`,
                );
              },
              messageId: "hookDeclaration",
              node: stmt,
            });
            continue;
          }

          if (!isComponent && !isHook) {
            continue;
          }

          // --- Sub-rule 0: fileNaming (once per file) ---
          if (!fileNamingReported) {
            const filename = context.filename;
            const basename = path.basename(filename, path.extname(filename));
            const dirname = path.basename(path.dirname(filename));

            if (basename !== "index" || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(dirname)) {
              fileNamingReported = true;
              context.report({
                messageId: "fileNaming",
                node: stmt,
              });
            }
          }

          // --- Sub-rule 1: inlineProps (components only) ---
          if (isComponent) {
            const declarator = (declaration as TSESTree.VariableDeclaration).declarations[0];
            const typeAnnotation = declarator.id.typeAnnotation?.typeAnnotation as TSESTree.TSTypeReference;
            const typeParams = typeAnnotation.typeArguments;
            if (typeParams != null && typeParams.params.length > 0) {
              const firstTypeArg = typeParams.params[0];
              const propsTypeName = `${componentName}Props`;
              if (firstTypeArg.type === "TSTypeLiteral") {
                const typeText = sourceCode.getText(firstTypeArg);

                context.report({
                  fix(fixer) {
                    const typeDecl = `export type ${propsTypeName} = ${typeText};\n\n`;
                    return [fixer.insertTextBefore(stmt, typeDecl), fixer.replaceText(firstTypeArg, propsTypeName)];
                  },
                  messageId: "inlineProps",
                  node: firstTypeArg,
                });
              } else if (firstTypeArg.type === "TSTypeReference") {
                const actualName = firstTypeArg.typeName.type === "Identifier" ? firstTypeArg.typeName.name : null;
                if (actualName != null && actualName !== propsTypeName) {
                  context.report({
                    data: { actual: actualName, expected: propsTypeName },
                    messageId: "propsTypeNaming",
                    node: firstTypeArg,
                  });
                }
              }
            }
          }

          // --- Sub-rule 2: destructuredParams ---
          const funcBody = getFunctionBody(stmt);
          if (funcBody == null) {
            continue;
          }

          let arrowFunc: null | TSESTree.ArrowFunctionExpression = null;
          let funcDecl: null | TSESTree.FunctionDeclaration = null;

          if (isComponent) {
            const declarator = (declaration as TSESTree.VariableDeclaration).declarations[0];
            arrowFunc = declarator.init as TSESTree.ArrowFunctionExpression;
          } else if (isHook) {
            funcDecl = declaration as TSESTree.FunctionDeclaration;
          }

          const params = arrowFunc != null ? arrowFunc.params : funcDecl != null ? funcDecl.params : [];

          if (params.length > 0 && params[0].type === "ObjectPattern") {
            const objectPattern = params[0];
            const paramName = isComponent ? "props" : "params";
            const destructuredText = sourceCode.getText(objectPattern);
            const typeAnnotation = objectPattern.typeAnnotation;
            const paramWithType =
              typeAnnotation != null ? `${paramName}${sourceCode.getText(typeAnnotation)}` : paramName;

            // Find the proper destructure target - just the pattern without type annotation
            let patternText: string;
            if (typeAnnotation != null) {
              const patternEnd = typeAnnotation.range[0];
              const patternStart = objectPattern.range[0];
              patternText = sourceCode.text.slice(patternStart, patternEnd).trimEnd();
            } else {
              patternText = destructuredText;
            }

            const destructureLine = `const ${patternText} = ${paramName};`;

            context.report({
              fix(fixer) {
                const bodyNode = funcBody.bodyNode;
                const openBrace = sourceCode.getFirstToken(bodyNode)!;
                const fixes = [
                  fixer.replaceText(objectPattern, paramWithType),
                  fixer.insertTextAfter(openBrace, `\n  ${destructureLine}\n`),
                ];
                return fixes;
              },
              messageId: "destructuredParams",
              node: objectPattern,
            });
          }

          // --- propsDestructuringLocation: props must be destructured on the first line ---
          if (isComponent && params.length > 0 && params[0].type === "Identifier") {
            const paramName = params[0].name;
            const firstStmt = funcBody.body[0];
            const isDestructuringFirst =
              firstStmt?.type === "VariableDeclaration" &&
              firstStmt.declarations[0]?.id.type === "ObjectPattern" &&
              firstStmt.declarations[0].init?.type === "Identifier" &&
              firstStmt.declarations[0].init.name === paramName;

            // Only report if destructuring exists somewhere but not on the first line
            // (thin wrappers that just spread props are fine)
            if (!isDestructuringFirst) {
              const hasDestructuringElsewhere = funcBody.body.some(
                (s) =>
                  s.type === "VariableDeclaration" &&
                  s.declarations[0]?.id.type === "ObjectPattern" &&
                  s.declarations[0].init?.type === "Identifier" &&
                  s.declarations[0].init.name === paramName,
              );
              if (hasDestructuringElsewhere) {
                context.report({
                  messageId: "propsDestructuringLocation",
                  node: firstStmt ?? stmt,
                });
              }
            }
          }

          // --- Section-based sub-rules ---
          const allComments = sourceCode.getAllComments();
          const sections = buildSections(allComments, funcBody.body, funcBody.bodyNode);

          if (sections.length === 0) {
            // No sections — check for missingBlankLine after destructuring only
            checkMissingBlankLineAfterDestructuring(context, funcBody, sections, sourceCode);
            continue;
          }

          // --- Sub-rule 3: sectionOrder ---
          const presentOrder = sections.map((s) => s.name);
          const canonicalOrder = SECTION_NAMES.filter((name) => presentOrder.includes(name));

          let isOutOfOrder = false;
          for (let i = 0; i < presentOrder.length; i++) {
            if (presentOrder[i] !== canonicalOrder[i]) {
              isOutOfOrder = true;
              break;
            }
          }

          if (isOutOfOrder) {
            context.report({
              data: { expected: canonicalOrder.join(" → ") },
              fix(fixer) {
                // Reorder sections into canonical order
                const sortedSections = [...sections].sort(
                  (a, b) => SECTION_NAMES.indexOf(a.name) - SECTION_NAMES.indexOf(b.name),
                );

                const firstSection = sections[0];
                const lastSection = sections[sections.length - 1];

                const lines = sourceCode.lines;
                const sectionTexts: string[] = [];
                for (const section of sortedSections) {
                  const commentLine = section.comment.loc.start.line;
                  // Collect lines from comment to end of section
                  let endLine: number;
                  if (section.statements.length > 0) {
                    endLine = section.statements[section.statements.length - 1].loc.end.line;
                  } else {
                    endLine = commentLine;
                  }
                  const sectionLines = lines.slice(commentLine - 1, endLine);
                  sectionTexts.push(sectionLines.join("\n"));
                }

                const newText = sectionTexts.join("\n\n");

                // Find the actual start (including leading whitespace/newlines before first comment)
                // and end positions in original text
                const originalStartLine = firstSection.comment.loc.start.line;
                let originalEndLine: number;
                if (lastSection.statements.length > 0) {
                  originalEndLine = lastSection.statements[lastSection.statements.length - 1].loc.end.line;
                } else {
                  originalEndLine = lastSection.comment.loc.start.line;
                }

                // Use line-based range for the replacement
                const startOffset = sourceCode.getIndexFromLoc({ column: 0, line: originalStartLine });
                const endOffset =
                  sourceCode.getIndexFromLoc({ column: 0, line: originalEndLine }) + lines[originalEndLine - 1].length;

                return fixer.replaceTextRange([startOffset, endOffset], newText);
              },
              messageId: "sectionOrder",
              node: sections[0].comment as unknown as TSESTree.Node,
            });
          }

          // --- Sub-rule 4: emptySection ---
          for (const section of sections) {
            if (section.statements.length === 0) {
              context.report({
                data: { name: section.name },
                fix(fixer) {
                  const commentLine = section.comment.loc.start.line;
                  const lines = sourceCode.lines;
                  // Remove the comment line and any blank line before it
                  let startLine = commentLine;
                  if (commentLine > 1 && lines[commentLine - 2].trim() === "") {
                    startLine = commentLine - 1;
                  }

                  // Also remove blank line after if present
                  let endLine = commentLine;
                  if (commentLine < lines.length && lines[commentLine]?.trim() === "") {
                    endLine = commentLine + 1;
                  }

                  const startOffset = sourceCode.getIndexFromLoc({ column: 0, line: startLine });
                  const endOffset =
                    endLine < lines.length
                      ? sourceCode.getIndexFromLoc({ column: 0, line: endLine + 1 })
                      : sourceCode.getIndexFromLoc({ column: 0, line: endLine }) + lines[endLine - 1].length;

                  return fixer.replaceTextRange([startOffset, endOffset], "");
                },
                messageId: "emptySection",
                node: section.comment as unknown as TSESTree.Node,
              });
            }
          }

          // --- Sub-rule 5: missingBlankLine ---
          const lines = sourceCode.lines;

          // After props destructuring (only when no section headers follow — the section header
          // blank-line check already covers the case where a section header is next)
          checkMissingBlankLineAfterDestructuring(context, funcBody, sections, sourceCode);

          // Before each section header
          for (const section of sections) {
            const commentLine = section.comment.loc.start.line;
            if (commentLine > 1) {
              const prevLineContent = lines[commentLine - 2];
              // Skip if it's the opening brace of the function body or already blank
              if (
                prevLineContent != null &&
                prevLineContent.trim() !== "" &&
                !prevLineContent.trimEnd().endsWith("{")
              ) {
                context.report({
                  data: { kind: "section header" },
                  fix(fixer) {
                    const startOfLine = sourceCode.getIndexFromLoc({ column: 0, line: commentLine });
                    return fixer.insertTextBeforeRange([startOfLine, startOfLine], "\n");
                  },
                  messageId: "missingBlankLine",
                  node: section.comment as unknown as TSESTree.Node,
                });
              }
            }
          }

          // Before early returns
          const lastSection = sections[sections.length - 1];
          const lastSectionEndLine =
            lastSection.statements.length > 0
              ? lastSection.statements[lastSection.statements.length - 1].loc.end.line
              : lastSection.comment.loc.start.line;

          for (const bodyStmt of funcBody.body) {
            if (isEarlyReturnStatement(bodyStmt) && bodyStmt.loc.start.line > lastSectionEndLine) {
              const stmtLine = bodyStmt.loc.start.line;
              if (stmtLine > 1) {
                const prevLineContent = lines[stmtLine - 2];
                if (prevLineContent != null && prevLineContent.trim() !== "") {
                  context.report({
                    data: { kind: "early return" },
                    fix(fixer) {
                      const startOfLine = sourceCode.getIndexFromLoc({ column: 0, line: stmtLine });
                      return fixer.insertTextBeforeRange([startOfLine, startOfLine], "\n");
                    },
                    messageId: "missingBlankLine",
                    node: bodyStmt,
                  });
                }
              }
            }
          }

          // --- Sub-rule 6: earlyReturn ---
          // An early return is misplaced if any section header appears after it.
          for (const bodyStmt of funcBody.body) {
            if (isEarlyReturnStatement(bodyStmt)) {
              const stmtLine = bodyStmt.loc.start.line;
              const hasSectionAfter = sections.some((s) => s.comment.loc.start.line > stmtLine);
              if (hasSectionAfter) {
                context.report({
                  messageId: "earlyReturn",
                  node: bodyStmt,
                });
              }
            }
          }

          // --- Sub-rule 7: sectionAssignment ---
          for (const section of sections) {
            for (const sectionStmt of section.statements) {
              const classification = classifyStatement(sectionStmt);
              if (classification != null && classification.section !== section.name) {
                context.report({
                  data: {
                    actual: section.name,
                    description: classification.description,
                    expected: classification.section,
                  },
                  messageId: "sectionAssignment",
                  node: sectionStmt,
                });
              }
            }
          }
        }
      },
    };
  },
});

function checkMissingBlankLineAfterDestructuring(
  context: Readonly<Parameters<ReturnType<typeof createRule>["create"]>[0]>,
  funcBody: { body: TSESTree.Statement[]; bodyNode: TSESTree.BlockStatement },
  sections: Section[],
  sourceCode: ReturnType<typeof context.sourceCode extends infer T ? () => T : never>,
): void {
  // Look for props/params destructuring as first statement
  const firstStmt = funcBody.body[0];
  if (
    firstStmt?.type === "VariableDeclaration" &&
    firstStmt.declarations[0]?.init?.type === "Identifier" &&
    (firstStmt.declarations[0].init.name === "props" || firstStmt.declarations[0].init.name === "params") &&
    firstStmt.declarations[0].id.type === "ObjectPattern"
  ) {
    const destructLine = firstStmt.loc.end.line;
    const lines = sourceCode.lines;

    // If the next line is a section header, the section-header blank-line check handles it
    if (sections.length > 0 && sections[0].comment.loc.start.line === destructLine + 1) {
      return;
    }

    const secondStmt = funcBody.body[1];

    if (secondStmt && destructLine < lines.length) {
      const nextLineContent = lines[destructLine];
      if (nextLineContent != null && nextLineContent.trim() !== "") {
        context.report({
          data: { kind: "props destructuring" },
          fix(fixer) {
            const startOfNextLine = sourceCode.getIndexFromLoc({ column: 0, line: destructLine + 1 });
            return fixer.insertTextBeforeRange([startOfNextLine, startOfNextLine], "\n");
          },
          messageId: "missingBlankLine",
          node: secondStmt,
        });
      }
    }
  }
}

function isScalarType(type: ts.Type): boolean {
  if (type.isUnion()) {
    return type.types.every(isScalarType);
  }
  const SCALAR_FLAGS =
    ts.TypeFlags.String |
    ts.TypeFlags.Number |
    ts.TypeFlags.Boolean |
    ts.TypeFlags.Null |
    ts.TypeFlags.Undefined |
    ts.TypeFlags.Void |
    ts.TypeFlags.BigInt |
    ts.TypeFlags.Never |
    ts.TypeFlags.StringLiteral |
    ts.TypeFlags.NumberLiteral |
    ts.TypeFlags.BooleanLiteral |
    ts.TypeFlags.BigIntLiteral |
    ts.TypeFlags.Enum |
    ts.TypeFlags.EnumLiteral;
  return (type.flags & SCALAR_FLAGS) !== 0;
}
