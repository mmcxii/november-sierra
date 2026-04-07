import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(() => "https://github.com/november-sierra/november-sierra");

type NameEntry = {
  name: string;
  node: TSESTree.ProgramStatement;
};

export const singleComponentPerFile = createRule({
  defaultOptions: [],
  meta: {
    docs: {
      description: "Enforce one component (or hook) per file",
    },
    messages: {
      extraComponent: "Only one component per file. Move '{{ name }}' to its own file.",
      extraDeclaration:
        "Component files should only contain the component, its props type, and variants. Move '{{ name }}' to its own file.",
      extraHook: "Only one hook per file. Move '{{ name }}' to its own file.",
      extraHookDeclaration: "Hook files should only contain the hook and its types. Move '{{ name }}' to its own file.",
    },
    schema: [],
    type: "problem",
  },
  name: "single-component-per-file",

  create(context) {
    return {
      Program(node: TSESTree.Program) {
        const components: NameEntry[] = [];
        const hooks: NameEntry[] = [];
        const extras: NameEntry[] = [];
        let hasComponent = false;
        let hasHook = false;

        for (const stmt of node.body) {
          // Always allowed: imports, expression statements ("use client"), type declarations
          if (
            stmt.type === "ImportDeclaration" ||
            stmt.type === "ExpressionStatement" ||
            stmt.type === "TSTypeAliasDeclaration" ||
            stmt.type === "TSInterfaceDeclaration"
          ) {
            continue;
          }

          // Re-exports: export { Foo } from "./foo"
          if (stmt.type === "ExportNamedDeclaration" && stmt.source) {
            continue;
          }

          // Exported type/interface declarations
          if (stmt.type === "ExportNamedDeclaration" && stmt.declaration) {
            if (
              stmt.declaration.type === "TSTypeAliasDeclaration" ||
              stmt.declaration.type === "TSInterfaceDeclaration"
            ) {
              continue;
            }
          }

          const isExported = stmt.type === "ExportNamedDeclaration";
          const declaration = isExported ? (stmt as TSESTree.ExportNamedDeclaration).declaration : stmt;

          if (declaration == null) {
            continue;
          }

          const names: NameEntry[] = [];

          if (declaration.type === "VariableDeclaration") {
            for (const declarator of declaration.declarations) {
              if (declarator.id.type === "Identifier") {
                names.push({ name: declarator.id.name, node: stmt });
              }
            }
          } else if (declaration.type === "FunctionDeclaration" && declaration.id) {
            names.push({ name: declaration.id.name, node: stmt });
          }

          for (const { name, node: reportNode } of names) {
            const isPascalCase = /^[A-Z][a-zA-Z0-9]+$/.test(name) && name !== name.toUpperCase();
            const isHookName = /^use[A-Z]/.test(name);
            const isVariants = name.endsWith("Variants");

            if (isHookName) {
              hooks.push({ name, node: reportNode });
              if (!hasHook) {
                hasHook = true;
              }
            } else if (isVariants) {
              // Variants (e.g. buttonVariants) are allowed alongside the primary component
            } else if (isPascalCase) {
              components.push({ name, node: reportNode });
              if (!hasComponent) {
                hasComponent = true;
              }
            } else {
              extras.push({ name, node: reportNode });
            }
          }
        }

        // Report extra components beyond the first
        for (let i = 1; i < components.length; i++) {
          context.report({
            data: { name: components[i].name },
            messageId: "extraComponent",
            node: components[i].node,
          });
        }

        // Report extra hooks beyond the first
        for (let i = 1; i < hooks.length; i++) {
          context.report({
            data: { name: hooks[i].name },
            messageId: "extraHook",
            node: hooks[i].node,
          });
        }

        // Report extras based on file type
        for (const extra of extras) {
          if (hasHook && !hasComponent) {
            context.report({
              data: { name: extra.name },
              messageId: "extraHookDeclaration",
              node: extra.node,
            });
          } else {
            context.report({
              data: { name: extra.name },
              messageId: "extraDeclaration",
              node: extra.node,
            });
          }
        }
      },
    };
  },
});
