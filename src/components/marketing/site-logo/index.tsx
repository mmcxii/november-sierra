import { Anchor } from "lucide-react";

export type SiteLogoProps = {
  /** RGB triplet override, e.g. "212 184 150". Falls back to --m-accent. */
  accent?: string;
  /** CSS color override for the background. Falls back to --m-card-bg. */
  cardBg?: string;
  className?: string;
  size?: "lg" | "md" | "sm";
};

const sizeMap = {
  lg: { icon: "size-11", inner: "inset-[6px]", outer: "size-28", strokeWidth: 1.25 },
  md: { icon: "size-9", inner: "inset-[5px]", outer: "size-20", strokeWidth: 1.5 },
  sm: { icon: "size-6", inner: "inset-[4px]", outer: "size-14", strokeWidth: 1.5 },
};

export const SiteLogo: React.FC<SiteLogoProps> = ({ accent, cardBg, className, size = "md" }) => {
  const s = sizeMap[size];
  const a = accent ?? "var(--m-accent)";
  const bg = cardBg ?? "var(--m-card-bg)";

  return (
    <div
      className={`relative flex ${s.outer} items-center justify-center rounded-full ${className ?? ""}`}
      style={{
        background: bg,
        border: `2px solid rgb(${a} / 0.50)`,
        boxShadow: `0 0 40px rgb(${a} / 0.08)`,
      }}
    >
      <div className={`absolute ${s.inner} rounded-full`} style={{ border: `1px solid rgb(${a} / 0.20)` }} />
      <Anchor className={s.icon} strokeWidth={s.strokeWidth} style={{ color: `rgb(${a})` }} />
    </div>
  );
};
