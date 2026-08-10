import { createConfig } from "@november-sierra/eslint-config";
import { defineConfig } from "eslint/config";

const eslintConfig = defineConfig([
  ...createConfig({ tsconfigRootDir: import.meta.dirname }),
  {
    files: ["src/app/apple-icon.tsx", "src/app/manifest.ts", "src/components/theme-script/**/*.tsx"],
    rules: {
      "november-sierra/no-inline-style": "off",
    },
  },
]);

export default eslintConfig;
