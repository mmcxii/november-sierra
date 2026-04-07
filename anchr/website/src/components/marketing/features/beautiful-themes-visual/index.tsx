import { themePalettes } from "../card-styles";
import { ThemeSwatch } from "../theme-swatch";

export const BeautifulThemesVisual: React.FC = () => (
  <div className="mt-5 flex gap-1.5">
    {themePalettes.map((palette) => (
      <ThemeSwatch key={palette.accent} {...palette} />
    ))}
  </div>
);
