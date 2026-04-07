import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(() => "https://github.com/november-sierra/november-sierra");

export const noInlineStyle = createRule({
  defaultOptions: [],
  meta: {
    docs: {
      description: "Disallow inline style prop in React components, use Tailwind classes instead",
    },
    messages: {
      noInlineStyle: "Avoid using inline 'style' prop. Use Tailwind CSS classes with 'className' instead.",
    },
    schema: [],
    type: "suggestion",
  },
  name: "no-inline-style",

  create(context) {
    return {
      JSXAttribute(node: TSESTree.JSXAttribute) {
        if (node.name.type === "JSXIdentifier" && node.name.name === "style") {
          context.report({
            messageId: "noInlineStyle",
            node,
          });
        }
      },
    };
  },
});
