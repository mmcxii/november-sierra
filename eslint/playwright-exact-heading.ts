import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(() => "https://github.com/novembersierra/anchr");

/**
 * Require `exact: true` when using Playwright's `getByRole('heading', { name })`.
 *
 * Heading text frequently overlaps (section titles, empty states, dialog titles),
 * causing strict-mode violations at runtime. Requiring `exact: true` prevents
 * accidental substring matches.
 */
export const playwrightExactHeading = createRule({
  defaultOptions: [],
  meta: {
    docs: {
      description: "Require exact: true on getByRole('heading') with a name option to avoid substring matches",
    },
    messages: {
      requireExact:
        "Add { exact: true } to getByRole('heading') with a name option. Heading text often overlaps, causing strict-mode violations.",
    },
    schema: [],
    type: "suggestion",
  },
  name: "playwright-exact-heading",

  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        // Match: *.getByRole('heading', { name: ... })
        if (
          node.callee.type !== "MemberExpression" ||
          node.callee.property.type !== "Identifier" ||
          node.callee.property.name !== "getByRole"
        ) {
          return;
        }

        const args = node.arguments;
        if (args.length < 2) {
          return;
        }

        // First arg must be 'heading'
        const firstArg = args[0];
        if (firstArg.type !== "Literal" || firstArg.value !== "heading") {
          return;
        }

        // Second arg must be an object with a `name` property
        const secondArg = args[1];
        if (secondArg.type !== "ObjectExpression") {
          return;
        }

        const hasName = secondArg.properties.some(
          (prop) => prop.type === "Property" && prop.key.type === "Identifier" && prop.key.name === "name",
        );

        if (!hasName) {
          return;
        }

        // Check if `exact: true` is present
        const hasExact = secondArg.properties.some(
          (prop) =>
            prop.type === "Property" &&
            prop.key.type === "Identifier" &&
            prop.key.name === "exact" &&
            prop.value.type === "Literal" &&
            prop.value.value === true,
        );

        if (!hasExact) {
          context.report({
            messageId: "requireExact",
            node,
          });
        }
      },
    };
  },
});
