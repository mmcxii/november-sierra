import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(() => "https://github.com/novembersierra/anchr");

type SectionName = "Act" | "Arrange" | "Assert";

const validTransitions: Record<SectionName, SectionName[]> = {
  Act: ["Assert"],
  Arrange: ["Act"],
  Assert: ["Arrange", "Act"],
};

const startSections: SectionName[] = ["Arrange", "Act"];

export const testAaaPattern = createRule({
  defaultOptions: [],
  meta: {
    docs: {
      description: "Enforce AAA (Arrange/Act/Assert) section headers in test callbacks using //* comments",
    },
    messages: {
      expectOutsideAssert: "expect() calls must be inside a '//* Assert' section",
      invalidSectionOrder: "'//* {{ current }}' cannot follow '//* {{ previous }}'. Expected: {{ expected }}",
      missingAct: "Test is missing a '//* Act' section header",
      missingAssert: "Test is missing a '//* Assert' section header",
    },
    schema: [],
    type: "problem",
  },
  name: "test-aaa-pattern",

  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== "Identifier" || (node.callee.name !== "it" && node.callee.name !== "test")) {
          return;
        }

        const callback = node.arguments[1];

        if (
          callback == null ||
          (callback.type !== "ArrowFunctionExpression" && callback.type !== "FunctionExpression")
        ) {
          return;
        }

        const body = callback.body;

        if (body.type !== "BlockStatement") {
          return;
        }

        const sourceCode = context.sourceCode;
        const comments = sourceCode.getCommentsInside(body);

        const sectionPattern = /^\*\s*(Arrange|Act|Assert)(\s|$)/;
        const sections: { line: number; name: SectionName }[] = [];

        for (const comment of comments) {
          if (comment.type !== "Line") {
            continue;
          }

          const match = sectionPattern.exec(comment.value);

          if (match != null) {
            sections.push({
              line: comment.loc.start.line,
              name: match[1] as SectionName,
            });
          }
        }

        sections.sort((a, b) => a.line - b.line);

        //* Check required sections
        const hasAct = sections.some((s) => s.name === "Act");
        const hasAssert = sections.some((s) => s.name === "Assert");

        if (!hasAct) {
          context.report({
            messageId: "missingAct",
            node: node.callee,
          });
        }

        if (!hasAssert) {
          context.report({
            messageId: "missingAssert",
            node: node.callee,
          });
        }

        //* Validate section ordering
        for (let i = 0; i < sections.length; i++) {
          const current = sections[i];

          if (i === 0) {
            if (!startSections.includes(current.name)) {
              context.report({
                data: {
                  current: current.name,
                  expected: startSections.join(" or "),
                  previous: "start",
                },
                messageId: "invalidSectionOrder",
                node: node.callee,
              });
            }

            continue;
          }

          const previous = sections[i - 1];
          const allowed = validTransitions[previous.name];

          if (!allowed.includes(current.name)) {
            context.report({
              data: {
                current: current.name,
                expected: allowed.join(" or "),
                previous: previous.name,
              },
              messageId: "invalidSectionOrder",
              node: node.callee,
            });
          }
        }

        //* Check expect() placement
        if (sections.length === 0) {
          return;
        }

        function findExpectCalls(blockNode: TSESTree.Node): TSESTree.CallExpression[] {
          const expectCalls: TSESTree.CallExpression[] = [];

          function visit(n: TSESTree.Node) {
            if (n.type === "CallExpression" && n.callee.type === "Identifier" && n.callee.name === "expect") {
              expectCalls.push(n);
            }

            // Also match expect().xxx() chains — the inner expect() is already caught above.
            // But we also need to catch expect(x).toBe(y) where expect is deeper.
            if (
              n.type === "CallExpression" &&
              n.callee.type === "MemberExpression" &&
              n.callee.object.type === "CallExpression" &&
              n.callee.object.callee.type === "Identifier" &&
              n.callee.object.callee.name === "expect"
            ) {
              // The inner expect() call is already handled by the check above when visited
            }

            for (const key of Object.keys(n)) {
              if (key === "parent") {
                continue;
              }

              const value = (n as unknown as Record<string, unknown>)[key];

              if (Array.isArray(value)) {
                for (const item of value) {
                  if (item != null && typeof item === "object" && "type" in item) {
                    visit(item as TSESTree.Node);
                  }
                }
              } else if (value != null && typeof value === "object" && "type" in value) {
                visit(value as TSESTree.Node);
              }
            }
          }

          for (const stmt of (blockNode as TSESTree.BlockStatement).body) {
            visit(stmt);
          }

          return expectCalls;
        }

        const expectCalls = findExpectCalls(body);

        for (const expectCall of expectCalls) {
          const expectLine = expectCall.loc.start.line;
          let currentSection: null | SectionName = null;

          for (const section of sections) {
            if (section.line < expectLine) {
              currentSection = section.name;
            }
          }

          if (currentSection !== "Assert") {
            context.report({
              messageId: "expectOutsideAssert",
              node: expectCall,
            });
          }
        }
      },
    };
  },
});
