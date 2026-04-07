"use client";

import { ArrowUpRight } from "lucide-react";
import * as React from "react";
import { HANDLES, PLATFORMS } from "./constants";

export const RedirectHubUrlPreview: React.FC = () => {
  const [handleIdx, setHandleIdx] = React.useState(0);
  const [platformIdx, setPlatformIdx] = React.useState(0);
  const [hidden, setHidden] = React.useState<null | "handle" | "platform">(null);
  const turn = React.useRef<"handle" | "platform">("platform");

  React.useEffect(() => {
    const id = setInterval(() => {
      const next = turn.current;
      setHidden(next);
      setTimeout(() => {
        if (next === "handle") {
          setHandleIdx((i) => (i + 1) % HANDLES.length);
        } else {
          setPlatformIdx((i) => (i + 1) % PLATFORMS.length);
        }
        setHidden(null);
        turn.current = next === "handle" ? "platform" : "handle";
      }, 260);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="m-embed-bg-bg m-muted-12-border flex items-center gap-0.5 rounded-lg px-3 py-2 font-mono text-[11px]">
      {/* eslint-disable-next-line anchr/no-raw-string-jsx -- brand URL prefix in mockup */}
      <span className="m-muted-30 shrink-0">anchr.to/</span>
      <span className={hidden === "handle" ? "m-seg-hidden" : "m-seg-visible"}>{HANDLES[handleIdx]}</span>
      <span className="m-muted-30 shrink-0">/</span>
      <span className={hidden === "platform" ? "m-seg-hidden" : "m-seg-visible"}>{PLATFORMS[platformIdx]}</span>
      <ArrowUpRight className="m-muted-25 ml-auto size-3 shrink-0" strokeWidth={1.5} />
    </div>
  );
};
