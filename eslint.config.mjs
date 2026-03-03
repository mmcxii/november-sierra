import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import pluginImport from "eslint-plugin-import";
import { defineConfig, globalIgnores } from "eslint/config";

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
      import: pluginImport,
    },
    rules: {
      curly: ["error", "all"],
      "import/no-default-export": "error",
    },
  },

  // Enable default exports for Next.js file conventions and config files
  {
    files: ["src/app/**/*.{ts,tsx}", "./*.config.{ts,mjs,cjs}"],
    rules: {
      "import/no-default-export": "off",
    },
  },
]);

export default eslintConfig;
