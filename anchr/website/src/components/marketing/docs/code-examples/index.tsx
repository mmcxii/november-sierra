"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { CodeBlock } from "../code-block";
import { CODE_LANGS, type CodeLang } from "../constants";

export type CodeExamplesProps = {
  examples: Record<CodeLang, { code: string; html: string }>;
};

export const CodeExamples: React.FC<CodeExamplesProps> = (props) => {
  const { examples } = props;

  const { t } = useTranslation();
  const [active, setActive] = React.useState<CodeLang>("curl");

  const handleTabClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const lang = e.currentTarget.dataset.lang as CodeLang;
    setActive(lang);
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <div className="flex border-b border-white/10 bg-[#0d1117]">
        {CODE_LANGS.map((lang) => {
          return (
            <button
              className={cn("px-4 py-2 text-xs font-medium transition-colors", {
                "border-b-2 border-white bg-white/5 text-white": active === lang,
                "text-white/50 hover:text-white/80": active !== lang,
              })}
              data-lang={lang}
              key={lang}
              onClick={handleTabClick}
              type="button"
            >
              {t(lang)}
            </button>
          );
        })}
      </div>
      <CodeBlock code={examples[active].code} highlightedHtml={examples[active].html} />
    </div>
  );
};
