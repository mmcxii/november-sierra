"use client";

import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type CodeBlockProps = {
  code: string;
  highlightedHtml: string;
};

export const CodeBlock: React.FC<CodeBlockProps> = (props) => {
  const { code, highlightedHtml } = props;

  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [code]);

  return (
    <div className="group relative overflow-hidden rounded-lg bg-[#0d1117]">
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
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-[#e6edf3]">
        <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      </pre>
    </div>
  );
};
