import { fixupPluginRules } from "@eslint/compat";
import { type ESLint } from "eslint";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import pluginImport from "eslint-plugin-import";
import { defineConfig, globalIgnores } from "eslint/config";
import { noDirectDbInComponents } from "./eslint/no-direct-db-in-components.js";
import { noInlineFunctionProps } from "./eslint/no-inline-function-props.js";
import { noInlineStyle } from "./eslint/no-inline-style.js";
import { noJsxWhitespaceLiteral } from "./eslint/no-jsx-whitespace-literal.js";
import { noRawStringJsx } from "./eslint/no-raw-string-jsx.js";
import { preferNullishCheck } from "./eslint/prefer-nullish-check.js";
import { reactStyleGuide } from "./eslint/react-style-guide.js";
import { singleComponentPerFile } from "./eslint/single-component-per-file.js";
import { testAaaPattern } from "./eslint/test-aaa-pattern.js";

// Shim eslint-plugin-react for ESLint 10 compatibility (react plugin still
// uses the legacy context.getFilename API removed in ESLint 10).
// TODO: Remove fixupPluginRules once eslint-plugin-react supports ESLint 10 natively.
function shimPlugins(configs: typeof nextVitals) {
  return configs.map((config) => {
    if (config.plugins == null) {
      return config;
    }
    const patched = { ...config.plugins };
    if (patched.react) {
      patched.react = fixupPluginRules(patched.react);
    }
    if (patched.import) {
      patched.import = fixupPluginRules(patched.import);
    }
    return { ...config, plugins: patched };
  });
}

const eslintConfig = defineConfig([
  ...shimPlugins(nextVitals),
  ...shimPlugins(nextTs),
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
          "no-direct-db-in-components": noDirectDbInComponents,
          "no-inline-function-props": noInlineFunctionProps,
          "no-inline-style": noInlineStyle,
          "no-jsx-whitespace-literal": noJsxWhitespaceLiteral,
          "no-raw-string-jsx": noRawStringJsx,
          "prefer-nullish-check": preferNullishCheck,
          "react-style-guide": reactStyleGuide,
          "single-component-per-file": singleComponentPerFile,
          "test-aaa-pattern": testAaaPattern,
        },
      } as unknown as ESLint.Plugin,
      import: fixupPluginRules(pluginImport),
    },
    rules: {
      "anchr/no-inline-style": "error",
      "anchr/no-jsx-whitespace-literal": "error",
      "anchr/react-style-guide": "error",
      curly: ["error", "all"],
      "import/no-default-export": "error",
      "import/order": [
        "error",
        {
          groups: [],
          "newlines-between": "never",
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-nested-ternary": "error",
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

  // Enforce extracting inline functions from JSX props
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "anchr/no-inline-function-props": "error",
      "anchr/no-raw-string-jsx": "error",
      "react/no-array-index-key": "error",
    },
  },

  // Type-aware rules (requires TypeScript type checker)
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: [".agents/**"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "anchr/prefer-nullish-check": "error",
    },
  },

  // Enforce one component per file (excluding UI primitives)
  {
    files: ["src/components/**/*.tsx", "src/hooks/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**"],
    rules: {
      "anchr/no-direct-db-in-components": "error",
      "anchr/single-component-per-file": "error",
    },
  },

  // Enforce AAA pattern in test files
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "anchr/test-aaa-pattern": "error",
    },
  },

  // Enable default exports for Next.js file conventions and config files
  {
    files: ["src/app/**/*.{ts,tsx}", "src/middleware.ts", "./*.config.{ts,mjs,cjs}", "./e2e/**/global.*.ts"],
    rules: {
      "import/no-default-export": "off",
    },
  },

  // Playwright fixtures use `use()` which is not a React hook
  {
    files: ["e2e/**/*.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },

  // Allow console.log in CLI scripts and agents
  {
    files: [".agents/**", "./**/scripts/**"],
    rules: {
      "no-console": "off",
    },
  },
]);

export default eslintConfig;
