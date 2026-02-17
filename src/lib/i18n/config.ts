export const defaultLocale = "en";
export const locales = ["en"] as const;
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export type Locale = (typeof locales)[number];

const i18nConfig = {
  defaultLocale,
  locales: locales as unknown as string[],
};

export default i18nConfig;
