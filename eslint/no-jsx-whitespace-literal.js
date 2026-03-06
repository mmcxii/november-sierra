/**
 * @type {import("eslint").Rule.RuleModule}
 */
export const noJsxWhitespaceLiteral = {
  create(context) {
    return {
      JSXExpressionContainer(node) {
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
};
