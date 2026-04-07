import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/november-sierra/november-sierra/blob/main/shared/eslint-config/${name}.ts`,
);

export const noCrossLicenseImport = createRule({
  create(context) {
    const filename = context.filename;

    const isInMitPackage = filename.includes("/shared/") || filename.includes("/november-sierra/");

    if (!isInMitPackage) {
      return {};
    }

    function isAgplSource(source: string): boolean {
      return source.startsWith("@november-sierra/anchr-") || /(?:^|[\\/])anchr[\\/]/.test(source);
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source === "string" && isAgplSource(source)) {
          context.report({
            data: { source },
            messageId: "crossLicenseImport",
            node,
          });
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Prevent AGPL-licensed code (anchr/) from being imported into MIT-licensed packages (shared/, november-sierra/)",
    },
    messages: {
      crossLicenseImport:
        "Importing AGPL-licensed code from '{{source}}' into a MIT-licensed package is not allowed. AGPL code in anchr/ cannot be used in shared/ or november-sierra/ packages.",
    },
    schema: [],
    type: "problem",
  },
  name: "no-cross-license-import",
});
