import { defaultLocale } from "@/lib/i18n/config";
import { createInstance, type CustomTypeOptions, type i18n, type TFunction } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";

type InitTranslationsResult = {
  i18n: i18n;
  resources: Record<string, CustomTypeOptions["resources"]>;
  t: TFunction;
};

export async function initTranslations(locale: string = defaultLocale): Promise<InitTranslationsResult> {
  const i18nInstance = createInstance();

  await i18nInstance
    .use(
      resourcesToBackend((lng: string) => {
        return import(`@/lib/i18n/locales/${lng}.json`);
      }),
    )
    .init({
      fallbackLng: defaultLocale,
      lng: locale,
    });

  return {
    i18n: i18nInstance,
    resources: {
      [locale]: i18nInstance.services.resourceStore.data[locale] as CustomTypeOptions["resources"],
    },
    t: i18nInstance.t,
  };
}
