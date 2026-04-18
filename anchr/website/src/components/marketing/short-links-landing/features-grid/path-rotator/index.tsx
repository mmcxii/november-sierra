"use client";

import * as React from "react";
import { DOMAINS, PATHS } from "./constants";

/**
 * Rotating `{domain}/{path}` pill for the Paths-and-domains card. Pattern
 * adapted from `redirect-hub-url-preview`: alternate segments fade out,
 * cycle index, fade back in. Domains are fixed-width (15 chars) so the left
 * segment doesn't jump; paths are variable so the pill flexes to the right.
 */
export const PathRotator: React.FC = () => {
  //* State
  const [domainIdx, setDomainIdx] = React.useState(0);
  const [pathIdx, setPathIdx] = React.useState(0);
  const [hidden, setHidden] = React.useState<null | "domain" | "path">(null);

  //* Refs
  const turn = React.useRef<"domain" | "path">("path");

  //* Effects
  React.useEffect(() => {
    const id = setInterval(() => {
      const next = turn.current;
      setHidden(next);
      setTimeout(() => {
        if (next === "domain") {
          setDomainIdx((i) => (i + 1) % DOMAINS.length);
        } else {
          setPathIdx((i) => (i + 1) % PATHS.length);
        }
        setHidden(null);
        turn.current = next === "domain" ? "path" : "domain";
      }, 260);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="m-embed-bg-bg m-muted-12-border mt-4 flex items-center gap-0.5 rounded-lg px-3 py-2 font-mono text-[11px]">
      <span className={hidden === "domain" ? "m-seg-hidden" : "m-seg-visible"}>{DOMAINS[domainIdx]}</span>
      { }
      <span className="m-muted-30 shrink-0">/</span>
      <span className={hidden === "path" ? "m-seg-hidden" : "m-seg-visible"}>{PATHS[pathIdx]}</span>
    </div>
  );
};
