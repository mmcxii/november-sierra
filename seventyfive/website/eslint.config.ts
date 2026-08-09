import { createConfig } from "@november-sierra/eslint-config";
import { defineConfig } from "eslint/config";

const eslintConfig = defineConfig([
  ...createConfig({ tsconfigRootDir: import.meta.dirname }),
  {
    files: ["src/components/theme-script/**/*.tsx", "src/app/manifest.ts"],
    rules: {
      "november-sierra/no-inline-style": "off",
    },
  },
]);

export default eslintConfig;
