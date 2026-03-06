import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import pluginImport from "eslint-plugin-import";
import { defineConfig, globalIgnores } from "eslint/config";
import { noInlineStyle } from "./eslint/no-inline-style.js";
import { noJsxWhitespaceLiteral } from "./eslint/no-jsx-whitespace-literal.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs", "**/*.cjs"],
    plugins: {
      anchr: {
        rules: {
          "no-inline-style": noInlineStyle,
          "no-jsx-whitespace-literal": noJsxWhitespaceLiteral,
        },
      },
      import: pluginImport,
    },
    rules: {
      "anchr/no-inline-style": "error",
      "anchr/no-jsx-whitespace-literal": "error",
      curly: ["error", "all"],
      "import/no-default-export": "error",
      "import/order": [
        "error",
        {
          groups: [],
          "newlines-between": "never",
        },
      ],
      "no-restricted-syntax": [
        "error",
        // Bans: cn(foo ? "a" : "b")
        {
          message: 'Avoid ternaries in cn(). Use object syntax: cn({ "class": condition }).',
          selector: "CallExpression[callee.name='cn'] > ConditionalExpression",
        },
        // Bans: cn(foo && "a")
        {
          message: 'Avoid logical expressions in cn(). Use object syntax: cn({ "class": condition }).',
          selector: "CallExpression[callee.name='cn'] > LogicalExpression",
        },
        // Bans: cn(`text-${color}`)
        {
          message: 'Avoid template literals in cn(). Use object syntax: cn({ "class": condition }).',
          selector: "CallExpression[callee.name='cn'] > TemplateLiteral",
        },
        // Bans: className={`foo ${bar}`}
        {
          message: "Avoid template literals in className. Use cn() with object syntax for conditional classes.",
          selector: "JSXAttribute[name.name='className'] > JSXExpressionContainer > TemplateLiteral",
        },
      ],
    },
  },

  // Enable default exports for Next.js file conventions and config files
  {
    files: ["src/app/**/*.{ts,tsx}", "src/middleware.ts", "./*.config.{ts,mjs,cjs}"],
    rules: {
      "import/no-default-export": "off",
    },
  },
]);

export default eslintConfig;
