import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(() => "https://github.com/november-sierra/november-sierra");

export const noJsxWhitespaceLiteral = createRule({
  defaultOptions: [],
  meta: {
    docs: {
      description: 'Disallow {" "} in JSX. Use the Trans component with interpolation instead.',
    },
    messages: {
      noJsxWhitespaceLiteral: 'Avoid {" "} for concatenation. Use the Trans component with interpolated JSX instead.',
    },
    schema: [],
    type: "suggestion",
  },
  name: "no-jsx-whitespace-literal",

  create(context) {
    return {
      JSXExpressionContainer(node: TSESTree.JSXExpressionContainer) {
        if (
          node.expression.type === "Literal" &&
          typeof node.expression.value === "string" &&
          node.expression.value.trim() === ""
        ) {
          context.report({
            messageId: "noJsxWhitespaceLiteral",
            node,
          });
        }
      },
    };
  },
});
