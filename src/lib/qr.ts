/** Dark-depths navy on cream — the single QR color scheme. */
export const QR_FOREGROUND = "#0a1729";
export const QR_BACKGROUND = "#fdfaf2";

export type QrSize = {
  label: string;
  px: number;
};

export const QR_SIZES: QrSize[] = [
  { label: "S", px: 256 },
  { label: "M", px: 512 },
  { label: "L", px: 1024 },
];

export const DEFAULT_QR_SIZE = QR_SIZES[1];

export type QrLogoOption = "anchor" | "avatar" | "none";

export type QrStyleOption = "dark" | "light";

/** Fraction of the QR size used for the center logo. */
export const LOGO_RATIO = 0.22;

/** QR canvas colors keyed by style. */
export const QR_STYLE_COLORS: Record<QrStyleOption, { bg: string; fg: string }> = {
  dark: { bg: QR_FOREGROUND, fg: "#d4b896" },
  light: { bg: QR_BACKGROUND, fg: QR_FOREGROUND },
};

/** Roundel color pairs keyed by QR style. */
const ROUNDEL_COLORS: Record<QrStyleOption, { accent: string; bg: string }> = {
  dark: { accent: "#d4b896", bg: "#0a1729" },
  light: { accent: "#d4b896", bg: "#1e2d42" },
};

/**
 * Build the Anchr roundel as an SVG data URL for stamping onto the export canvas.
 * Matches the SiteLogo component in the dark-depths theme.
 */
export const buildAnchorSvgUrl = (size: number, style: QrStyleOption = "light"): string => {
  const { accent, bg } = ROUNDEL_COLORS[style];
  const half = size / 2;
  const borderWidth = size * 0.04;
  const innerInset = size * 0.08;
  const iconScale = size / 64;

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<circle cx="${half}" cy="${half}" r="${half}" fill="${bg}"/>`,
    `<circle cx="${half}" cy="${half}" r="${half - borderWidth / 2}" fill="none" stroke="${accent}" stroke-opacity="0.5" stroke-width="${borderWidth}"/>`,
    `<circle cx="${half}" cy="${half}" r="${half - innerInset}" fill="none" stroke="${accent}" stroke-opacity="0.2" stroke-width="1"/>`,
    `<g transform="translate(${half - 12 * iconScale},${half - 12 * iconScale}) scale(${iconScale})" fill="none" stroke="${accent}" stroke-linecap="round" stroke-linejoin="round" stroke-width="${1.5 / iconScale}">`,
    `<path d="M12 6v16"/>`,
    `<path d="m19 13 2-1a9 9 0 0 1-18 0l2 1"/>`,
    `<path d="M9 11h6"/>`,
    `<circle cx="12" cy="4" r="2"/>`,
    `</g>`,
    `</svg>`,
  ].join("");

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

/**
 * Composite the QR canvas with an optional center logo and trigger a PNG download.
 */
export const downloadQrPng = (qrCanvas: HTMLCanvasElement, filename: string, logoSrc?: string): void => {
  const size = qrCanvas.width;
  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  const ctx = out.getContext("2d");
  if (ctx == null) {
    return;
  }

  ctx.drawImage(qrCanvas, 0, 0);

  if (logoSrc == null) {
    triggerDownload(out, filename);
    return;
  }

  const img = new Image();
  img.onload = () => {
    const logoSize = Math.round(size * LOGO_RATIO);
    const offset = Math.round((size - logoSize) / 2);
    ctx.drawImage(img, offset, offset, logoSize, logoSize);
    triggerDownload(out, filename);
  };
  img.src = logoSrc;
};

const triggerDownload = (canvas: HTMLCanvasElement, filename: string): void => {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
