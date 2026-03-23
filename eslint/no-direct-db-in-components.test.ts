import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import { noDirectDbInComponents } from "./no-direct-db-in-components.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-direct-db-in-components", noDirectDbInComponents, {
  invalid: [
    {
      code: 'import { db } from "@/lib/db";',
      errors: [{ messageId: "noDirectDb" }],
    },
    {
      code: 'import { linksTable } from "@/lib/db/schema/link";',
      errors: [{ messageId: "noDirectDb" }],
    },
    {
      code: 'import { getAnalytics } from "@/lib/db/queries/analytics";',
      errors: [{ messageId: "noDirectDb" }],
    },
    {
      code: 'import { type DateRange, getAnalytics } from "@/lib/db/queries/analytics";',
      errors: [{ messageId: "noDirectDb" }],
    },
  ],
  valid: [
    {
      code: 'import type { linksTable } from "@/lib/db/schema/link";',
    },
    {
      code: 'import { type DateRange } from "@/lib/db/queries/analytics";',
    },
    {
      code: 'import { type DateRange, type AnalyticsRow } from "@/lib/db/queries/analytics";',
    },
    {
      code: 'import { createLink } from "@/app/(dashboard)/dashboard/actions";',
    },
  ],
});
