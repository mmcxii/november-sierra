import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import { playwrightExactHeading } from "./playwright-exact-heading.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("playwright-exact-heading", playwrightExactHeading, {
  invalid: [
    {
      code: 'page.getByRole("heading", { name: "Webhooks" })',
      errors: [{ messageId: "requireExact" }],
    },
    {
      code: 'page.getByRole("heading", { name: t.webhooks })',
      errors: [{ messageId: "requireExact" }],
    },
    {
      code: 'dialog.getByRole("heading", { name: t.editWebhook })',
      errors: [{ messageId: "requireExact" }],
    },
  ],
  valid: [
    {
      code: 'page.getByRole("heading", { exact: true, name: "Webhooks" })',
    },
    {
      code: 'page.getByRole("heading", { exact: true, name: t.webhooks })',
    },
    {
      code: 'page.getByRole("heading", { name: t.webhooks, exact: true })',
    },
    // No name option — no risk of substring match
    {
      code: 'page.getByRole("heading")',
    },
    // Not a heading — rule doesn't apply
    {
      code: 'page.getByRole("button", { name: "Save" })',
    },
    // Single arg — no options object
    {
      code: 'page.getByRole("heading", {})',
    },
  ],
});
