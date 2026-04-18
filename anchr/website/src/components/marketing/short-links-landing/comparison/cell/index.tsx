import type { TranslationKey } from "@/lib/i18n/i18next.d";
import { cn } from "@/lib/utils";
import type { TFunction } from "i18next";
import { Check, X } from "lucide-react";
import type { Cell as CellValue } from "../constants";

export type CellProps = {
  cell: CellValue;
  isAnchr: boolean;
  t: TFunction;
};

/**
 * Table cell renderer for the short-links comparison. Three shapes:
 * `check` for ✓ entries (accent-tinted in the Anchr column, muted elsewhere),
 * `x` for flat ✗ entries, and `label` for competitor tier strings like "$8/mo"
 * which we look up for translation when possible and fall through to the
 * literal string for pricing tokens.
 */
export const Cell: React.FC<CellProps> = (props) => {
  const { cell, isAnchr, t } = props;

  if (cell.kind === "check") {
    return (
      <Check
        aria-label={t("included")}
        className={cn("mx-auto size-4", { "m-muted-30": !isAnchr, "text-anc-gold": isAnchr })}
        strokeWidth={2}
      />
    );
  }

  if (cell.kind === "x") {
    return <X aria-label={t("notIncluded")} className="m-muted-30 mx-auto size-4" strokeWidth={1.5} />;
  }

  // Label cells render free-form competitor tier strings. We look up the
  // translation first (e.g. "partial" → "Partial") and fall back to the raw
  // label for pricing strings like "$8/mo" that are not translated.
  const translated = t(cell.label as TranslationKey);
  const display = translated === cell.label ? cell.label : translated;

  return (
    <span className={cn("text-xs font-medium", { "m-accent-60-color": isAnchr, "m-muted-50": !isAnchr })}>
      {display}
    </span>
  );
};
