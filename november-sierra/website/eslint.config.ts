import { createConfig } from "@november-sierra/eslint-config";
import { defineConfig } from "eslint/config";

const eslintConfig = defineConfig([
  ...createConfig({ tsconfigRootDir: import.meta.dirname }),

  // Allow inline style for hero animation (dynamic transition-delay per element)
  {
    files: ["src/components/sections/hero/**/*.tsx"],
    rules: {
      "november-sierra/no-inline-style": "off",
    },
  },

  // Allow inline style for OG image routes (next/og ImageResponse requires inline styles)
  {
    files: ["src/app/opengraph-image.tsx", "src/app/twitter-image.tsx"],
    rules: {
      "november-sierra/no-inline-style": "off",
    },
  },
]);

export default eslintConfig;
