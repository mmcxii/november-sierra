"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type CopyButtonProps = {
  value: string;
};

export const CopyButton: React.FC<CopyButtonProps> = (props) => {
  const { value } = props;

  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(t("npubCopied"));
  };

  React.useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      aria-label={copied ? t("copied") : t("copy")}
      className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-white/10"
      onClick={handleClick}
      type="button"
    >
      {copied ? (
        <Check className="text-anc-theme-link-icon size-4" strokeWidth={1.75} />
      ) : (
        <Copy className="text-anc-theme-link-icon size-4" strokeWidth={1.75} />
      )}
    </button>
  );
};
