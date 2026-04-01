"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { CODE_EXAMPLES, TABS, type TabId } from "./constants";

export const CodeTabs: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<TabId>("curl");

  const handleTabClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const tab = e.currentTarget.dataset.tab as TabId;
    setActiveTab(tab);
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]">
      <div className="flex border-b border-white/10">
        {TABS.map((tab) => {
          return (
            <button
              className={cn("px-4 py-2.5 text-sm font-medium transition-colors", {
                "border-b-2 border-white bg-white/5 text-white": activeTab === tab,
                "text-white/50 hover:text-white/80": activeTab !== tab,
              })}
              data-tab={tab}
              key={tab}
              onClick={handleTabClick}
              type="button"
            >
              {t(tab)}
            </button>
          );
        })}
      </div>
      <div className="p-5 text-[#e6edf3]">
        <pre className="overflow-x-auto text-sm leading-relaxed">
          <code dangerouslySetInnerHTML={{ __html: CODE_EXAMPLES[activeTab] }} />
        </pre>
      </div>
    </div>
  );
};
