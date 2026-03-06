/**
 * @type {import("eslint").Rule.RuleModule}
 */
export const noInlineStyle = {
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name === "style") {
          context.report({
            messageId: "noInlineStyle",
            node,
          });
        }
      },
    };
  },
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
};
