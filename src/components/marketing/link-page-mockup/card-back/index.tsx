import { SiteLogo } from "@/components/marketing/site-logo";
import { cn } from "@/lib/utils";
import { Anchor } from "lucide-react";
import * as React from "react";

export const CardBack: React.FC = () => (
  <div className="m-backface-hidden border-anc-steel/20 bg-anc-deep-navy absolute inset-0 transform-[rotateY(180deg)] overflow-hidden rounded-2xl border">
    {/* Wave pattern */}
    <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern height="18" id="anchrWaves" patternUnits="userSpaceOnUse" width="280" x="0" y="0">
          <path
            d="M-70,9 C-52.5,2 -17.5,16 0,9 C17.5,2 52.5,16 70,9 C87.5,2 122.5,16 140,9 C157.5,2 192.5,16 210,9 C227.5,2 262.5,16 280,9 C297.5,2 332.5,16 350,9"
            fill="none"
            opacity="0.22"
            stroke="#92b0be"
            strokeWidth="0.75"
          />
        </pattern>
      </defs>
      <rect fill="url(#anchrWaves)" height="100%" width="100%" />
    </svg>

    {/* Inset gold border */}
    <div className="border-anc-gold/25 absolute inset-[10px] rounded-xl border" />

    {/* Corner anchors */}
    {["top-4 left-4", "top-4 right-4 rotate-180", "bottom-4 left-4 rotate-180", "bottom-4 right-4"].map((pos) => (
      <div className={cn("text-anc-gold/35 absolute", pos)} key={pos}>
        <Anchor className="size-3.5" strokeWidth={1.5} />
      </div>
    ))}

    {/* Center medallion — always dark regardless of page theme */}
    <div className="absolute inset-0 flex items-center justify-center" data-marketing-theme="dark">
      <SiteLogo size="lg" />
    </div>
  </div>
);
