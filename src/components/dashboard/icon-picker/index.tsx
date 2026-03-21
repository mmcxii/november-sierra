"use client";

import { Input } from "@/components/ui/input";
import { RenderedIcon } from "@/components/ui/rendered-icon";
import { type IconEntry, getSuggestedIconId, searchIcons } from "@/lib/icon-registry";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type IconPickerProps = {
  detectedPlatform?: null | string;
  value: null | string;
  onChange: (iconId: null | string) => void;
};

export const IconPicker: React.FC<IconPickerProps> = (props) => {
  const { detectedPlatform, onChange, value } = props;

  //* State
  const { t } = useTranslation();
  const [query, setQuery] = React.useState("");

  //* Variables
  const suggestedIconId = getSuggestedIconId(detectedPlatform ?? null);
  const results = searchIcons(query);

  // Hoist suggested icon to front
  const sortedResults = React.useMemo(() => {
    if (suggestedIconId == null) {
      return results;
    }

    const suggested: IconEntry[] = [];
    const rest: IconEntry[] = [];

    for (const icon of results) {
      if (icon.id === suggestedIconId) {
        suggested.push(icon);
      } else {
        rest.push(icon);
      }
    }

    return [...suggested, ...rest];
  }, [results, suggestedIconId]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
        <Input
          className="pr-8 pl-8"
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchIcons")}
          type="text"
          value={query}
        />
        {value != null && (
          <button
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 p-0.5"
            onClick={() => onChange(null)}
            title={t("clearIcon")}
            type="button"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto rounded-lg border p-1.5">
        {sortedResults.map((icon) => (
          <button
            className={cn("flex size-8 items-center justify-center rounded-md transition-colors", {
              "bg-primary text-primary-foreground": value === icon.id,
              "text-muted-foreground hover:bg-muted hover:text-foreground": value !== icon.id,
            })}
            key={icon.id}
            onClick={() => onChange(value === icon.id ? null : icon.id)}
            title={icon.name}
            type="button"
          >
            <RenderedIcon className="size-4" iconId={icon.id} />
          </button>
        ))}
        {sortedResults.length === 0 && (
          <p className="text-muted-foreground col-span-8 py-4 text-center text-sm">{t("noIconsFound")}</p>
        )}
      </div>
    </div>
  );
};
