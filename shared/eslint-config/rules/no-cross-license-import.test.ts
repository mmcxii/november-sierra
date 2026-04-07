import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import { noCrossLicenseImport } from "./no-cross-license-import.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester();

tester.run("no-cross-license-import", noCrossLicenseImport, {
  invalid: [
    // AGPL import in shared/ (MIT)
    {
      code: 'import { foo } from "@november-sierra/anchr-website";',
      errors: [{ messageId: "crossLicenseImport" as const }],
      filename: "/repo/shared/eslint-config/src/index.ts",
    },
    // AGPL import in november-sierra/ (MIT)
    {
      code: 'import { bar } from "@november-sierra/anchr-api-client";',
      errors: [{ messageId: "crossLicenseImport" as const }],
      filename: "/repo/november-sierra/website/src/index.ts",
    },
    // Relative path import from anchr/ in shared/
    {
      code: 'import { baz } from "../../anchr/website/src/lib/utils";',
      errors: [{ messageId: "crossLicenseImport" as const }],
      filename: "/repo/shared/eslint-config/src/index.ts",
    },
  ],
  valid: [
    // Imports within anchr/ are fine (AGPL -> AGPL)
    {
      code: 'import { foo } from "@november-sierra/anchr-website";',
      filename: "/repo/anchr/api-client/src/index.ts",
    },
    // Non-anchr imports in shared/ are fine
    {
      code: 'import { bar } from "lodash";',
      filename: "/repo/shared/eslint-config/src/index.ts",
    },
    // Non-anchr imports in november-sierra/ are fine
    {
      code: 'import { baz } from "@november-sierra/eslint-config";',
      filename: "/repo/november-sierra/website/src/index.ts",
    },
  ],
});
