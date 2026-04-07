"use client";

import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { CODE_SOURCES, TABS, type TabId } from "./constants";

export type CodeTabsProps = {
  highlightedHtml: Record<TabId, string>;
};

export const CodeTabs: React.FC<CodeTabsProps> = (props) => {
  const { highlightedHtml } = props;

  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<TabId>("curl");
  const [copied, setCopied] = React.useState(false);

  const handleTabClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const tab = e.currentTarget.dataset.tab as TabId;
    setActiveTab(tab);
  }, []);

  const handleCopy = React.useCallback(async () => {
    await navigator.clipboard.writeText(CODE_SOURCES[activeTab]);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [activeTab]);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]">
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
      <button
        className={cn(
          "absolute top-2 right-2 z-10 rounded-md p-1.5 text-white/40 transition-colors hover:text-white/80",
          { "opacity-0 group-hover:opacity-100 focus:opacity-100": !copied },
        )}
        onClick={handleCopy}
        title={t("copy")}
        type="button"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
      <div className="p-5 text-[#e6edf3]">
        <pre className="overflow-x-auto text-sm leading-relaxed">
          <code dangerouslySetInnerHTML={{ __html: highlightedHtml[activeTab] }} />
        </pre>
      </div>
    </div>
  );
};
