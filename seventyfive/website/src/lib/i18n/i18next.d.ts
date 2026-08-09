import type enUS from "./locales/en-US.json";

export type TranslationKey = keyof typeof enUS;

declare module "i18next" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- interface required for module augmentation
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof enUS;
    };
  }
}
