import type { TranslationKey } from "@/lib/i18n/i18next";
import enUS from "@/lib/i18n/locales/en-US.json";

export function english(key: TranslationKey): string {
  return enUS[key];
}
