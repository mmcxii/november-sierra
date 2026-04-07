"use client";

import { useLinkPageTheme } from "@/components/link-page/theme-provider/context";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { MODES } from "./utils";

export const LinkPageThemeToggle: React.FC = () => {
  const { mode, setMode } = useLinkPageTheme();
  const { t } = useTranslation();

  return (
    <div className="anchr-theme-toggle flex items-center gap-1">
      {MODES.map(({ icon: Icon, labelKey, value }) => {
        const handleButtonOnClick = () => setMode(value);

        return (
          <button
            aria-label={t(labelKey)}
            className="text-anc-theme-brand cursor-pointer rounded-md p-1.5 transition-opacity"
            key={value}
            onClick={handleButtonOnClick}
            // eslint-disable-next-line anchr/no-inline-style -- active indicator
            style={{ opacity: mode === value ? 1 : 0.4 }}
            type="button"
          >
            <Icon className="size-3.5" strokeWidth={1.5} />
          </button>
        );
      })}
    </div>
  );
};
