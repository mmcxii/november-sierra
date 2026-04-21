import { fixupPluginRules } from "@eslint/compat";
import type { ESLint, Linter } from "eslint";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";
import { noCrossLicenseImport } from "./rules/no-cross-license-import.js";
import { noDirectDbInComponents } from "./rules/no-direct-db-in-components.js";
import { noImplicitReturnArrow } from "./rules/no-implicit-return-arrow.js";
import { noInlineFunctionProps } from "./rules/no-inline-function-props.js";
import { noInlineStyle } from "./rules/no-inline-style.js";
import { noJsxWhitespaceLiteral } from "./rules/no-jsx-whitespace-literal.js";
import { noRawStringJsx } from "./rules/no-raw-string-jsx.js";
import { playwrightExactHeading } from "./rules/playwright-exact-heading.js";
import { preferNullishCheck } from "./rules/prefer-nullish-check.js";
import { reactStyleGuide } from "./rules/react-style-guide.js";
import { singleComponentPerFile } from "./rules/single-component-per-file.js";
import { testAaaPattern } from "./rules/test-aaa-pattern.js";

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

type CreateConfigOptions = {
  tsconfigRootDir: string;
};

export function createConfig(options: CreateConfigOptions): Linter.Config[] {
  return defineConfig([
    ...shimPlugins(nextVitals),
    ...shimPlugins(nextTs),
    globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

    // Plugin registration + base rules for all files
    {
      files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs", "**/*.cjs"],
      plugins: {
        "november-sierra": {
          rules: {
            "no-cross-license-import": noCrossLicenseImport,
            "no-direct-db-in-components": noDirectDbInComponents,
            "no-implicit-return-arrow": noImplicitReturnArrow,
            "no-inline-function-props": noInlineFunctionProps,
            "no-inline-style": noInlineStyle,
            "no-jsx-whitespace-literal": noJsxWhitespaceLiteral,
            "no-raw-string-jsx": noRawStringJsx,
            "playwright-exact-heading": playwrightExactHeading,
            "prefer-nullish-check": preferNullishCheck,
            "react-style-guide": reactStyleGuide,
            "single-component-per-file": singleComponentPerFile,
            "test-aaa-pattern": testAaaPattern,
          },
        } as unknown as ESLint.Plugin,
      },
      rules: {
        curly: ["error", "all"],
        "import/no-default-export": "error",
        "import/order": ["error", { groups: [], "newlines-between": "never" }],
        "no-console": ["warn", { allow: ["warn", "error"] }],
        "no-nested-ternary": "error",
        "no-restricted-syntax": [
          "error",
          {
            message: 'Avoid ternaries in cn(). Use object syntax: cn({ "class": condition }).',
            selector: "CallExpression[callee.name='cn'] > ConditionalExpression",
          },
          {
            message: 'Avoid logical expressions in cn(). Use object syntax: cn({ "class": condition }).',
            selector: "CallExpression[callee.name='cn'] > LogicalExpression",
          },
          {
            message: 'Avoid template literals in cn(). Use object syntax: cn({ "class": condition }).',
            selector: "CallExpression[callee.name='cn'] > TemplateLiteral",
          },
          {
            message: "Avoid template literals in className. Use cn() with object syntax for conditional classes.",
            selector: "JSXAttribute[name.name='className'] > JSXExpressionContainer > TemplateLiteral",
          },
        ],
        "november-sierra/no-inline-style": "error",
        "november-sierra/no-jsx-whitespace-literal": "error",
        "november-sierra/react-style-guide": "error",
      },
    },

    // Source file rules
    {
      files: ["src/**/*.{ts,tsx}"],
      rules: {
        "november-sierra/no-implicit-return-arrow": "warn",
        "november-sierra/no-inline-function-props": "error",
        "react/no-array-index-key": "error",
      },
    },

    // Type-aware rules (requires TypeScript type checker)
    {
      files: ["**/*.ts", "**/*.tsx"],
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: options.tsconfigRootDir,
        },
      },
      rules: {
        "@typescript-eslint/consistent-type-definitions": ["error", "type"],
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-non-null-assertion": "error",
        "november-sierra/prefer-nullish-check": "error",
      },
    },

    // Component/hook structure rules (excluding UI primitives)
    {
      files: ["src/components/**/*.tsx", "src/hooks/**/*.{ts,tsx}"],
      ignores: ["src/components/ui/**"],
      rules: {
        "november-sierra/single-component-per-file": "error",
      },
    },

    // Test file rules
    {
      files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
      rules: {
        "november-sierra/test-aaa-pattern": "error",
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

    // next.config must not import envSchema or any module that re-exports it.
    // Next inlines every key listed in its `env` config into the client bundle
    // (webpack DefinePlugin), so importing envSchema here is a direct path to
    // leaking server secrets — exactly what happened in ANC-191.
    // @t3-oss/env-nextjs already enforces the client/server split on its own;
    // there is no legitimate reason to reach into the envSchema module from
    // next.config.
    {
      files: ["next.config.ts", "next.config.js", "next.config.mjs", "next.config.cjs"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["./src/lib/env", "./src/lib/env.ts", "@/lib/env"],
                message:
                  "next.config must not import envSchema. Next inlines values in its `env` config into the client bundle — spreading or referencing envSchema here leaks server secrets. See ANC-191.",
              },
            ],
          },
        ],
      },
    },
  ]);
}
