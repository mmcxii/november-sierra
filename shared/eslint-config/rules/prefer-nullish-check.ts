import { getConstrainedTypeAtLocation } from "@typescript-eslint/type-utils";
import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import ts from "typescript";

function unionHasFlag(type: ts.Type, flag: number): boolean {
  if (type.isUnion()) {
    return type.types.some((t) => (t.flags & flag) !== 0);
  }
  return (type.flags & flag) !== 0;
}

/**
 * Returns true when a truthy check on this type should be flagged.
 *
 * Logic:
 * 1. Skip any / unknown — too loose to lint
 * 2. Skip if type includes boolean or BooleanLiteral — truthy checks are idiomatic
 * 3. Flag only if type is nullable (includes Null, Undefined, or Void)
 * 4. Skip non-nullable types — no null/undefined to guard against
 */
function shouldFlagTruthyCheck(type: ts.Type): boolean {
  // 1. Skip any / unknown
  if ((type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0) {
    return false;
  }

  // 2. Skip booleans — truthy checks are idiomatic for boolean types
  if (unionHasFlag(type, ts.TypeFlags.Boolean) || unionHasFlag(type, ts.TypeFlags.BooleanLiteral)) {
    return false;
  }

  // 3. Flag only if nullable
  const isNullable =
    unionHasFlag(type, ts.TypeFlags.Null) ||
    unionHasFlag(type, ts.TypeFlags.Undefined) ||
    unionHasFlag(type, ts.TypeFlags.Void);

  return isNullable;
}

function isSimpleIdentifierOrMember(node: TSESTree.Node): node is TSESTree.Identifier | TSESTree.MemberExpression {
  return node.type === "Identifier" || (node.type === "MemberExpression" && !node.computed);
}

const createRule = ESLintUtils.RuleCreator(() => "https://github.com/november-sierra/november-sierra");

export const preferNullishCheck = createRule({
  defaultOptions: [],
  meta: {
    docs: {
      description: "Prefer nullish checks over truthy checks for nullable types",
    },
    fixable: "code",
    messages: {
      preferNullishCheck: "Use nullish check ({{ identifier }} != null) instead of truthy check",
      preferNullishNegation: "Use nullish check ({{ identifier }} == null) instead of negated truthy check",
    },
    schema: [],
    type: "suggestion",
  },
  name: "prefer-nullish-check",

  create(context) {
    const services = ESLintUtils.getParserServices(context);

    function getNodeText(node: TSESTree.Node): string {
      return context.sourceCode.getText(node);
    }

    function getTypeForNode(node: TSESTree.Node) {
      return getConstrainedTypeAtLocation(services, node);
    }

    function reportTruthyCheck(node: TSESTree.Node, testNode: TSESTree.Expression) {
      // Handle negation: !value → value == null
      if (
        testNode.type === "UnaryExpression" &&
        testNode.operator === "!" &&
        isSimpleIdentifierOrMember(testNode.argument)
      ) {
        const type = getTypeForNode(testNode.argument);
        if (!shouldFlagTruthyCheck(type)) {
          return;
        }

        context.report({
          data: { identifier: getNodeText(testNode.argument) },
          fix(fixer) {
            return fixer.replaceText(testNode, `${getNodeText(testNode.argument)} == null`);
          },
          messageId: "preferNullishNegation",
          node: testNode,
        });
        return;
      }

      if (!isSimpleIdentifierOrMember(testNode)) {
        return;
      }

      const type = getTypeForNode(testNode);
      if (!shouldFlagTruthyCheck(type)) {
        return;
      }

      context.report({
        data: {
          identifier: getNodeText(testNode),
        },
        fix(fixer) {
          return fixer.replaceText(testNode, `${getNodeText(testNode)} != null`);
        },
        messageId: "preferNullishCheck",
        node: testNode,
      });
    }

    function checkLogicalExpression(node: TSESTree.LogicalExpression) {
      // Handle negation: !value && expr → value == null && expr
      if (
        node.left.type === "UnaryExpression" &&
        node.left.operator === "!" &&
        isSimpleIdentifierOrMember(node.left.argument) &&
        node.operator === "&&"
      ) {
        const argument = node.left.argument;
        const type = getTypeForNode(argument);
        if (!shouldFlagTruthyCheck(type)) {
          return;
        }

        context.report({
          data: { identifier: getNodeText(argument) },
          fix(fixer) {
            return fixer.replaceText(node.left, `${getNodeText(argument)} == null`);
          },
          messageId: "preferNullishNegation",
          node: node.left,
        });
        return;
      }

      if (!isSimpleIdentifierOrMember(node.left)) {
        return;
      }

      const type = getTypeForNode(node.left);
      if (!shouldFlagTruthyCheck(type)) {
        return;
      }

      // Handle: userId && <Component />
      if (node.operator === "&&") {
        context.report({
          data: { identifier: getNodeText(node.left) },
          fix(fixer) {
            return fixer.replaceText(node.left, `${getNodeText(node.left)} != null`);
          },
          messageId: "preferNullishCheck",
          node: node.left,
        });
      }

      // Handle: userId || fallback
      if (node.operator === "||") {
        context.report({
          data: { identifier: getNodeText(node.left) },
          fix(fixer) {
            return fixer.replaceText(node, `${getNodeText(node.left)} ?? ${getNodeText(node.right)}`);
          },
          messageId: "preferNullishCheck",
          node: node.left,
        });
      }
    }

    return {
      IfStatement(node) {
        reportTruthyCheck(node, node.test);
      },

      ConditionalExpression(node) {
        reportTruthyCheck(node, node.test);
      },

      LogicalExpression: checkLogicalExpression,

      WhileStatement(node) {
        reportTruthyCheck(node, node.test);
      },

      ForStatement(node) {
        if (node.test != null) {
          reportTruthyCheck(node, node.test);
        }
      },
    };
  },
});
