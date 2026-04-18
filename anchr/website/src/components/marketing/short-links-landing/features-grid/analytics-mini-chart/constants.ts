// Sparkline points (7 days). Raw values scaled into SVG y-coordinates at
// render time; chosen to rise then ease so the curve looks like real traffic.
export const SPARKLINE_POINTS = [4, 7, 6, 11, 9, 14, 13];

export const SOURCE_BARS: readonly { heightClass: string; label: string }[] = [
  { heightClass: "h-12", label: "Profile" },
  { heightClass: "h-8", label: "Short URL" },
  { heightClass: "h-4", label: "Direct" },
];

export const SPARKLINE_WIDTH = 140;
export const SPARKLINE_HEIGHT = 40;
export const SPARKLINE_PADDING = 4;
