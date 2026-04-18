import type { TranslationKey } from "@/lib/i18n/i18next.d";

export type Cell = { kind: "check" } | { kind: "label"; label: string } | { kind: "x" };

export type Row = {
  anchr: Cell;
  bitly: Cell;
  feature: TranslationKey;
  tinyurl: Cell;
};

// Ordering (top → bottom): 4-row wall of pure ✗ on competitors, 3-row dollar
// contrast, 2-row Pro-gated tail. This deliberate sort makes the first thing
// the eye hits a block of empty cells on Bitly/TinyURL.
export const ROWS: readonly Row[] = [
  { anchr: { kind: "check" }, bitly: { kind: "x" }, feature: "passwordProtection", tinyurl: { kind: "x" } },
  { anchr: { kind: "check" }, bitly: { kind: "x" }, feature: "linkExpiry", tinyurl: { kind: "x" } },
  { anchr: { kind: "check" }, bitly: { kind: "x" }, feature: "mcpAiAgentTools", tinyurl: { kind: "x" } },
  { anchr: { kind: "check" }, bitly: { kind: "x" }, feature: "linkInBioPageIncluded", tinyurl: { kind: "x" } },
  {
    anchr: { kind: "check" },
    bitly: { kind: "label", label: "$35/mo" },
    feature: "clickSourceAttribution",
    tinyurl: { kind: "label", label: "partial" },
  },
  {
    anchr: { kind: "check" },
    bitly: { kind: "label", label: "$29/mo" },
    feature: "publicRestApi",
    tinyurl: { kind: "label", label: "$19/mo" },
  },
  {
    anchr: { kind: "check" },
    bitly: { kind: "label", label: "$8/mo" },
    feature: "utmCampaignBuilder",
    tinyurl: { kind: "x" },
  },
  {
    anchr: { kind: "check" },
    bitly: { kind: "label", label: "$8/mo" },
    feature: "customShortDomain",
    tinyurl: { kind: "label", label: "enterprise" },
  },
  {
    anchr: { kind: "check" },
    bitly: { kind: "label", label: "$8/mo" },
    feature: "customBrandedPaths",
    tinyurl: { kind: "label", label: "$9.99/mo" },
  },
];

// Bump this when the competitor comparison is reviewed. Surfaces in the
// footer caption next to the pricing disclaimer.
export const VERIFIED_DATE = "April 2026";
