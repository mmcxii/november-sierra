import type { TranslationKey } from "@/lib/i18n/i18next.d";

export type Step = {
  body: TranslationKey;
  heading: TranslationKey;
};

export const STEPS: readonly Step[] = [
  { body: "pasteAnyUrlGetACleanAnchToShortLinkInSeconds", heading: "create" },
  { body: "addASlugAPasswordAnExpiryDateOrBringYourOwnDomain", heading: "customize" },
  { body: "everyClickTrackedHonestlyInTheSameDashboardAsYourBioPage", heading: "track" },
];
