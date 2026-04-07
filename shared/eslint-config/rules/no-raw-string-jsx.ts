import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(() => "https://github.com/november-sierra/november-sierra");

const EXEMPT_SINGLE_CHARS = new Set(["/", "·", "|", "—", "-", "×", "•", "+"]);

function isWhitespaceOnly(text: string): boolean {
  return text.trim().length === 0;
}

function isExemptSingleChar(text: string): boolean {
  return EXEMPT_SINGLE_CHARS.has(text);
}

function isNumericOnly(text: string): boolean {
  return /^[\d.]+$/.test(text);
}

function isInsideTransComponent(node: TSESTree.Node): boolean {
  let current: undefined | TSESTree.Node = node.parent;

  while (current != null) {
    if (
      current.type === "JSXElement" &&
      current.openingElement.name.type === "JSXIdentifier" &&
      current.openingElement.name.name === "Trans"
    ) {
      return true;
    }

    current = current.parent;
  }

  return false;
}

function shouldReport(text: string): boolean {
  const trimmed = text.trim();

  if (isWhitespaceOnly(text)) {
    return false;
  }

  if (isExemptSingleChar(trimmed)) {
    return false;
  }

  if (isNumericOnly(trimmed)) {
    return false;
  }

  return true;
}

export const noRawStringJsx = createRule({
  defaultOptions: [],
  meta: {
    docs: {
      description: "Disallow raw string literals as JSX text content. Use t() or <Trans> for user-facing text.",
    },
    messages: {
      noRawStringJsx: "Raw string in JSX. Use the t() function or <Trans> component for user-facing text.",
    },
    schema: [],
    type: "suggestion",
  },
  name: "no-raw-string-jsx",

  create(context) {
    return {
      JSXExpressionContainer(node: TSESTree.JSXExpressionContainer) {
        const { expression } = node;

        // Only target string literals (not template literals or other expressions)
        if (expression.type !== "Literal" || typeof expression.value !== "string") {
          return;
        }

        // Skip if this is a prop value, not a child
        if (node.parent.type === "JSXAttribute") {
          return;
        }

        if (isInsideTransComponent(node)) {
          return;
        }

        if (!shouldReport(expression.value)) {
          return;
        }

        context.report({
          messageId: "noRawStringJsx",
          node,
        });
      },

      JSXText(node: TSESTree.JSXText) {
        if (isInsideTransComponent(node)) {
          return;
        }

        if (!shouldReport(node.value)) {
          return;
        }

        context.report({
          messageId: "noRawStringJsx",
          node,
        });
      },
    };
  },
});
