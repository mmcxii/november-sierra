import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(() => "https://github.com/novembersierra/anchr");

export const noDirectDbInComponents = createRule({
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Disallow non-type imports from @/lib/db in component files. DB access should live in server actions or query modules.",
    },
    messages: {
      noDirectDb:
        "Do not import runtime values from '@/lib/db' in components. Use server actions or extract a query helper instead. Type-only imports are allowed.",
    },
    schema: [],
    type: "problem",
  },
  name: "no-direct-db-in-components",

  create(context) {
    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        const source = node.source.value;

        if (typeof source !== "string" || !source.startsWith("@/lib/db")) {
          return;
        }

        // Allow `import type { ... }` (top-level type-only import)
        if (node.importKind === "type") {
          return;
        }

        // Check if ALL specifiers are type-only
        const hasValueImport = node.specifiers.some((s) => s.type === "ImportSpecifier" && s.importKind !== "type");

        if (!hasValueImport) {
          return;
        }

        context.report({
          messageId: "noDirectDb",
          node,
        });
      },
    };
  },
});
