"use client";

import { IconButton } from "@/components/dashboard/icon-picker/icon-button/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type IconEntry, getSuggestedIconId, searchIcons } from "@/lib/icon-registry";
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

  //* Handlers
  const handleInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value);

  const handleClearSearchButtonOnClick = () => setQuery("");

  const handleIconButtonOnClick = (icon: IconEntry) => onChange(value === icon.id ? null : icon.id);

  const handleRemoveIconButtonOnClick = () => onChange(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
        <Input
          className="pr-8 pl-8"
          onChange={handleInputOnChange}
          placeholder={t("searchIcons")}
          type="text"
          value={query}
        />
        {query.length > 0 && (
          <button
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 p-0.5"
            onClick={handleClearSearchButtonOnClick}
            title={t("clearSearch")}
            type="button"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto rounded-lg border p-1.5">
        {sortedResults.map((icon) => (
          <IconButton icon={icon} isSelected={value === icon.id} key={icon.id} onClick={handleIconButtonOnClick} />
        ))}
        {sortedResults.length === 0 && (
          <p className="text-muted-foreground col-span-8 py-4 text-center text-sm">{t("noIconsFound")}</p>
        )}
      </div>
      {value != null && (
        <Button className="self-start" onClick={handleRemoveIconButtonOnClick} type="button" variant="tertiary">
          {t("removeCustomIcon")}
        </Button>
      )}
    </div>
  );
};
