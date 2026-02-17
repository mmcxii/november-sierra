import { defaultLocale } from "@/lib/i18n/config";
import { createInstance, type i18n, type TFunction } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";

type InitTranslationsResult = {
  i18n: i18n;
  resources: Record<string, Record<string, string>>;
  t: TFunction;
};

export async function initTranslations(locale: string = defaultLocale): Promise<InitTranslationsResult> {
  const i18nInstance = createInstance();

  await i18nInstance.use(resourcesToBackend((lng: string) => import(`@/lib/i18n/locales/${lng}.json`))).init({
    defaultNS: "translation",
    fallbackLng: defaultLocale,
    lng: locale,
    ns: ["translation"],
  });

  return {
    i18n: i18nInstance,
    resources: { [locale]: i18nInstance.services.resourceStore.data[locale] } as Record<string, Record<string, string>>,
    t: i18nInstance.t,
  };
}
