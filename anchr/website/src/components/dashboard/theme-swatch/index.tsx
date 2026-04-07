import type { ThemeSwatch as ThemeSwatchType } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { DASHBOARD_BARS, LINK_BARS } from "./utils";

export type ThemeSwatchProps = {
  isLoading?: boolean;
  isSelected?: boolean;
  name: string;
  swatch: ThemeSwatchType;
  variant?: "dashboard" | "page";
  onClick: () => void;
};

export const ThemeSwatch: React.FC<ThemeSwatchProps> = (props) => {
  const { isLoading, isSelected, name, onClick, swatch, variant = "page" } = props;

  return (
    <button
      aria-pressed={isSelected}
      className={cn("flex flex-col overflow-hidden rounded-lg border-2 text-left transition-colors", {
        "border-border hover:border-muted-foreground/40": !isSelected,
        "border-primary": isSelected,
      })}
      onClick={onClick}
      type="button"
    >
      {/* eslint-disable anchr/no-inline-style -- swatch must render each theme's actual colors via inline hex values */}
      {variant === "page" ? (
        <div
          className="pointer-events-none overflow-hidden border-b select-none"
          style={{ backgroundColor: swatch.bg, borderColor: `${swatch.accent}30` }}
        >
          {/* Hairline accent gradient */}
          <div
            className="h-px w-full"
            style={{
              background: `linear-gradient(to right, transparent, ${swatch.accent}cc, transparent)`,
            }}
          />

          {/* Avatar circle */}
          <div
            className="mx-auto mt-2.5 size-4 rounded-full"
            style={{ backgroundColor: swatch.accent, opacity: 0.35 }}
          />

          {/* Link bars */}
          <div className="mx-3 mt-2 space-y-1.5 pb-3">
            {LINK_BARS.map((op) => (
              <div className="h-1.5 rounded-sm" key={op} style={{ backgroundColor: swatch.accent, opacity: op }} />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="pointer-events-none flex overflow-hidden border-b select-none"
          style={{ backgroundColor: swatch.bg, borderColor: `${swatch.accent}30` }}
        >
          {/* Sidebar */}
          <div style={{ backgroundColor: swatch.card, width: "16.67%" }} />

          {/* Divider */}
          <div className="w-px self-stretch" style={{ backgroundColor: `${swatch.accent}40` }} />

          {/* Main content area */}
          <div className="flex-1 px-2.5 py-3">
            <div className="space-y-2">
              {DASHBOARD_BARS.map((op) => (
                <div className="h-1.5 rounded-sm" key={op} style={{ backgroundColor: swatch.accent, opacity: op }} />
              ))}
            </div>
          </div>
        </div>
      )}
      {/* eslint-enable anchr/no-inline-style */}

      {/* Label bar — uses dashboard theme via Tailwind classes */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="text-sm font-medium">{name}</span>
        {isSelected &&
          (isLoading ? (
            <Loader2 className="text-primary ml-auto size-4 animate-spin" />
          ) : (
            <Check className="text-primary ml-auto size-4" />
          ))}
      </div>
    </button>
  );
};
