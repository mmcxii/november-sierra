export const CARD_BASE =
  "relative overflow-hidden rounded-2xl backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg";
export const CARD_CLASSES = "m-card-bg-bg m-card-border";
export const CTA_CLASSES =
  "mt-8 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md px-6 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const FREE_FEATURES = [
  "upTo5Links",
  "anchrToUsernameUrl",
  "upTo20ShortUrlsPerMonthOnAnchTo",
  "linkExpiry",
  "basicAnalytics",
  "4Themes",
] as const;

export const PRO_FEATURES = [
  "unlimitedLinks",
  "advancedAnalytics",
  "customDomains",
  "customShortPaths",
  "passwordProtectedShortUrls",
  "fullThemeCustomization",
  "prioritySupport",
] as const;
