import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(() => "https://github.com/novembersierra/anchr");

/**
 * Method names where an implicit-return arrow callback is allowed
 * because the arrow acts as a predicate, comparator, or transform
 * returning a non-JSX value.
 */
const ALLOWED_CALLBACK_METHODS = new Set([
  "every",
  "filter",
  "find",
  "findIndex",
  "flatMap",
  "map",
  "reduce",
  "some",
  "sort",
  "toSorted",
]);

/**
 * Returns true if the arrow function is a direct argument to an allowed
 * array method call (e.g., `items.map(x => x.id)`).
 */
function isAllowedCallbackArg(node: TSESTree.ArrowFunctionExpression): boolean {
  const { parent } = node;

  if (parent == null || parent.type !== "CallExpression") {
    return false;
  }

  const { callee } = parent;

  // obj.method(arrow)
  if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
    return ALLOWED_CALLBACK_METHODS.has(callee.property.name);
  }

  return false;
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

export const noImplicitReturnArrow = createRule({
  create(context) {
    return {
      ArrowFunctionExpression(node) {
        // Only flag concise-body arrows (implicit return)
        if (node.body.type === "BlockStatement") {
          return;
        }

        // If the implicit return contains JSX, always flag it
        if (containsJsx(node.body)) {
          context.report({ messageId: "noImplicitReturn", node });
          return;
        }

        // Allow implicit returns in predicate/transform callbacks
        if (isAllowedCallbackArg(node)) {
          return;
        }

        // Flag everything else
        context.report({ messageId: "noImplicitReturn", node });
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Disallow implicit-return arrow functions except when used as a predicate or transform callback (e.g., .map, .filter, .sort) that returns a non-JSX value.",
    },
    messages: {
      noImplicitReturn:
        "Avoid implicit-return arrow functions. Use a block body with an explicit return statement. Exception: array method callbacks like .map(), .filter(), .sort().",
    },
    schema: [],
    type: "suggestion",
  },
  name: "no-implicit-return-arrow",
});
