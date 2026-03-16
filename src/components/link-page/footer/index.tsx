import { Anchor } from "lucide-react";
import * as React from "react";

export const Footer: React.FC = () => {
  return (
    <div className="border-anc-theme-divider mt-auto flex items-center justify-center gap-2 border-t pt-6 pb-2">
      <a
        className="tracking-anc-caps-wide text-anc-theme-brand flex items-center gap-2 text-xs font-bold uppercase transition-opacity hover:opacity-80"
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
