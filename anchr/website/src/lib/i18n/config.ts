export const defaultLocale = "en-US";
export const locales = ["en-US"] as const;
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export type Locale = (typeof locales)[number];

export const i18nConfig = {
  defaultLocale,
  locales: locales as unknown as string[],
};
