import { Lock } from "lucide-react";

/**
 * Miniature rendering of the /unlock/[slug] page that ships in the
 * shortener product. Static; no interaction. Lives in the Password
 * protection card.
 */
export const UnlockFormPreview: React.FC = () => {
  return (
    <div className="m-embed-bg-bg m-muted-12-border mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5">
      <Lock className="m-muted-40 size-3.5 shrink-0" strokeWidth={1.5} />
      <div className="m-page-bg-bg m-muted-12-border flex-1 rounded px-2 py-1 font-mono text-[11px]">
        {/* eslint-disable-next-line november-sierra/no-raw-string-jsx -- masked password placeholder */}
        <span className="m-muted-55-color">{"••••••••"}</span>
      </div>
      <div className="m-accent-bg m-page-bg-color shrink-0 rounded px-2 py-1 text-[10px] font-medium">
        {/* eslint-disable-next-line november-sierra/no-raw-string-jsx -- button label in static mockup */}
        {"Unlock"}
      </div>
    </div>
  );
};
