"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// All exactly 6 characters — monospace font keeps the handle segment width stable
const HANDLES = ["calvin", "marina", "alexis", "oliver", "jordan"];
const PLATFORMS = ["instagram", "youtube", "tiktok", "linkedin", "x", "nostr"];

const seg = (hidden: boolean): React.CSSProperties => ({
  color: `rgb(var(--m-accent) / 0.7)`,
  display: "inline-block",
  opacity: hidden ? 0 : 1,
  transform: hidden ? "translateY(-4px)" : "translateY(0px)",
  transition: "opacity 0.26s ease, transform 0.26s ease",
});

export const RedirectHubUrlPreview: React.FC = () => {
  const [handleIdx, setHandleIdx] = useState(0);
  const [platformIdx, setPlatformIdx] = useState(0);
  const [hidden, setHidden] = useState<null | "handle" | "platform">(null);
  const turn = useRef<"handle" | "platform">("platform");

  useEffect(() => {
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
    <div
      className="flex items-center gap-0.5 rounded-lg px-3 py-2 font-mono text-[11px]"
      style={{ background: `var(--m-embed-bg)`, border: `1px solid rgb(var(--m-muted) / 0.10)` }}
    >
      <span className="shrink-0" style={{ color: `rgb(var(--m-muted) / 0.30)` }}>
        anchr.to/
      </span>
      <span style={seg(hidden === "handle")}>{HANDLES[handleIdx]}</span>
      <span className="shrink-0" style={{ color: `rgb(var(--m-muted) / 0.30)` }}>
        /
      </span>
      <span style={seg(hidden === "platform")}>{PLATFORMS[platformIdx]}</span>
      <ArrowUpRight
        className="ml-auto size-3 shrink-0"
        strokeWidth={1.5}
        style={{ color: `rgb(var(--m-muted) / 0.25)` }}
      />
    </div>
  );
};
