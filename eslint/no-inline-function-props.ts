import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(() => "https://github.com/novembersierra/anchr");

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function containsJsx(node: TSESTree.Node): boolean {
  if (node.type === "JSXElement" || node.type === "JSXFragment") {
    return true;
  }

  for (const key of Object.keys(node)) {
    if (key === "parent") {
      continue;
    }

    const value = (node as unknown as Record<string, unknown>)[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object" && "type" in item && containsJsx(item as TSESTree.Node)) {
          return true;
        }
      }
    } else if (value && typeof value === "object" && "type" in value) {
      if (containsJsx(value as TSESTree.Node)) {
        return true;
      }
    }
  }

  return false;
}

function findEnclosingFunctionBody(node: TSESTree.Node): null | TSESTree.Statement[] {
  let current: undefined | TSESTree.Node = node.parent;

  while (current != null) {
    if (
      current.type === "FunctionDeclaration" ||
      current.type === "FunctionExpression" ||
      current.type === "ArrowFunctionExpression"
    ) {
      const body = current.body;

      if (body.type === "BlockStatement") {
        return body.body;
      }

      return null;
    }

    current = current.parent;
  }

  return null;
}

function findEnclosingFunction(node: TSESTree.Node): null | TSESTree.Node {
  let current: undefined | TSESTree.Node = node.parent;

  while (current != null) {
    if (
      current.type === "FunctionDeclaration" ||
      current.type === "FunctionExpression" ||
      current.type === "ArrowFunctionExpression"
    ) {
      return current;
    }

    current = current.parent;
  }

  return null;
}

function getVariableNamesInScope(enclosingFn: TSESTree.Node): Set<string> {
  const names = new Set<string>();
  const body =
    enclosingFn.type === "FunctionDeclaration" || enclosingFn.type === "FunctionExpression"
      ? (enclosingFn as TSESTree.FunctionDeclaration | TSESTree.FunctionExpression).body
      : (enclosingFn as TSESTree.ArrowFunctionExpression).body;

  if (body.type !== "BlockStatement") {
    return names;
  }

  for (const stmt of body.body) {
    if (stmt.type === "VariableDeclaration") {
      for (const decl of stmt.declarations) {
        if (decl.id.type === "Identifier") {
          names.add(decl.id.name);
        }
      }
    }
  }

  return names;
}

export const noInlineFunctionProps = createRule({
  defaultOptions: [],
  meta: {
    docs: {
      description: "Disallow inline functions in JSX props. Extract to a named handler.",
    },
    fixable: "code",
    messages: {
      noInlineFunctionProps: "Avoid inline functions in JSX props. Extract to a named handler.",
    },
    schema: [],
    type: "suggestion",
  },
  name: "no-inline-function-props",

  create(context) {
    return {
      JSXAttribute(node: TSESTree.JSXAttribute) {
        // Must have a JSXExpressionContainer value
        if (!node.value || node.value.type !== "JSXExpressionContainer") {
          return;
        }

        const expr = node.value.expression;

        // Only target arrow functions and function expressions
        if (expr.type !== "ArrowFunctionExpression" && expr.type !== "FunctionExpression") {
          return;
        }

        // Exemption: ref callbacks
        if (node.name.type === "JSXIdentifier" && node.name.name === "ref") {
          return;
        }

        // Exemption: functions whose body returns JSX
        if (containsJsx(expr)) {
          return;
        }

        // Generate handler name
        const openingElement = node.parent as TSESTree.JSXOpeningElement;
        const tagNameNode = openingElement.name;
        let tagName: string;

        if (tagNameNode.type === "JSXIdentifier") {
          tagName = capitalize(tagNameNode.name);
        } else if (tagNameNode.type === "JSXMemberExpression") {
          // e.g. Foo.Bar → use "Bar"
          tagName = tagNameNode.property.name;
        } else {
          tagName = "Element";
        }

        const propName = node.name.type === "JSXIdentifier" ? capitalize(node.name.name) : "Handler";
        const handlerName = `handle${tagName}${propName}`;

        // Find enclosing function for scope check and insertion
        const enclosingFn = findEnclosingFunction(node);

        if (enclosingFn == null) {
          context.report({
            messageId: "noInlineFunctionProps",
            node: node.value,
          });
          return;
        }

        // Check for naming conflicts
        const existingNames = getVariableNamesInScope(enclosingFn);

        if (existingNames.has(handlerName)) {
          // Report only, no fix
          context.report({
            messageId: "noInlineFunctionProps",
            node: node.value,
          });
          return;
        }

        // Find the return statement for insertion point
        const body = findEnclosingFunctionBody(node);

        if (body == null) {
          context.report({
            messageId: "noInlineFunctionProps",
            node: node.value,
          });
          return;
        }

        const returnStmt = body.find((stmt) => stmt.type === "ReturnStatement");

        if (returnStmt == null) {
          context.report({
            messageId: "noInlineFunctionProps",
            node: node.value,
          });
          return;
        }

        const sourceCode = context.sourceCode;
        const functionText = sourceCode.getText(expr);

        // Determine indentation of the return statement
        const returnLine = sourceCode.lines[returnStmt.loc.start.line - 1];
        const indent = returnLine.match(/^(\s*)/)?.[1] ?? "";

        context.report({
          fix(fixer) {
            return [
              // Insert extracted handler before the return statement
              fixer.insertTextBefore(returnStmt, `const ${handlerName} = ${functionText};\n\n${indent}`),
              // Replace the inline function with the handler reference
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- value is always present for JSXAttribute with a function expression
              fixer.replaceText(node.value!, `{${handlerName}}`),
            ];
          },
          messageId: "noInlineFunctionProps",
          node: node.value,
        });
      },
    };
  },
});
