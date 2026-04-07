import { ThemeBar } from "../theme-bar";
import { useStyleRef } from "../use-style-ref";

export type ThemeSwatchProps = { accent: string; bg: string; border: string };

export const ThemeSwatch: React.FC<ThemeSwatchProps> = (props) => {
  const { accent, bg, border } = props;

  const cardRef = useStyleRef({ background: bg, border: `1px solid ${border}` });
  const hairRef = useStyleRef({ background: `linear-gradient(to right, transparent, ${accent}cc, transparent)` });
  const dotRef = useStyleRef({ background: accent, opacity: "0.4" });

  return (
    <div className="relative flex-1 overflow-hidden rounded-lg pb-3" ref={cardRef}>
      <div className="h-px w-full" ref={hairRef} />
      <div className="mx-auto mt-1.5 size-3 rounded-full" ref={dotRef} />
      <div className="mx-1.5 mt-1.5 space-y-1">
        {[0.4, 0.25, 0.15].map((op) => (
          <ThemeBar accent={accent} key={op} opacity={op} />
        ))}
      </div>
    </div>
  );
};
