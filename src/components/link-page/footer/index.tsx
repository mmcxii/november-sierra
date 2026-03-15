import { Anchor } from "lucide-react";
import * as React from "react";

export const Footer: React.FC = () => {
  return (
    <div className="mt-auto flex items-center justify-center gap-2 border-t border-[var(--_mc-divider)] pt-6 pb-2">
      <a
        className="flex items-center gap-2 text-xs font-bold tracking-[0.25em] text-[var(--_mc-brand)] uppercase transition-opacity hover:opacity-80"
        href="https://anchr.to?ref=user_page"
        rel="noopener noreferrer"
        target="_blank"
      >
        <Anchor className="size-4" strokeWidth={1.5} />
        Anchr
      </a>
    </div>
  );
};
