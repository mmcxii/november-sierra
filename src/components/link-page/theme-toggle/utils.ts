import type { PageMode } from "@/components/link-page/theme-provider/context";
import type { TranslationKey } from "@/lib/i18n/i18next.d";
import { Monitor, Moon, Sun } from "lucide-react";

export const MODES: { icon: typeof Monitor; labelKey: TranslationKey; value: PageMode }[] = [
  { icon: Monitor, labelKey: "switchToSystemTheme", value: "system" },
  { icon: Sun, labelKey: "switchToLightTheme", value: "light" },
  { icon: Moon, labelKey: "switchToDarkTheme", value: "dark" },
];
