import type { TranslationKey } from "@/lib/i18n/i18next";
import type { ThemeMode } from "@/lib/theme";
import { Monitor, Moon, Sun } from "lucide-react";

export const MODE_OPTIONS: { icon: typeof Monitor; label: TranslationKey; value: ThemeMode }[] = [
  { icon: Monitor, label: "system", value: "system" },
  { icon: Sun, label: "light", value: "light" },
  { icon: Moon, label: "dark", value: "dark" },
];
