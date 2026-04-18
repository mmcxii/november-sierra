import { ChevronRight } from "lucide-react";
import { CHIPS } from "./constants";

/**
 * Tag chain visualization for the UTM-builder card. Three chips linked by
 * chevrons, each chip showing one UTM param (source → medium → campaign).
 * Static composition — no animation.
 */
export const UtmChain: React.FC = () => {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5">
      {CHIPS.map((chip, i) => (
        <div className="flex items-center gap-1.5" key={chip.label}>
          <div className="m-accent-05-bg m-accent-18-border flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px]">
            <span className="m-muted-55-color">{chip.label}</span>
            {/* eslint-disable-next-line november-sierra/no-raw-string-jsx -- URL param separator */}
            <span className="m-muted-40">{"="}</span>
            <span className="m-accent-60-color">{chip.value}</span>
          </div>
          {i < CHIPS.length - 1 && <ChevronRight className="m-muted-25 size-3 shrink-0" strokeWidth={1.5} />}
        </div>
      ))}
    </div>
  );
};
