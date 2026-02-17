"use client";

import { defaultLocale } from "@/lib/i18n/config";
import { createInstance, type CustomTypeOptions } from "i18next";
import { I18nextProvider } from "react-i18next";

export type TranslationsProviderProps = React.PropsWithChildren<{
  locale: string;
  resources: Record<string, CustomTypeOptions["resources"]>;
}>;

export const TranslationsProvider: React.FC<TranslationsProviderProps> = (props) => {
  const { children, locale, resources } = props;

  const i18nInstance = createInstance();

  i18nInstance.init({
    defaultNS: "translation",
    fallbackLng: defaultLocale,
    lng: locale,
    ns: ["translation"],
    resources,
  });

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
};
