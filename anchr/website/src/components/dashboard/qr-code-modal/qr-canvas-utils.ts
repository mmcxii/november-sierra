// ── Layout ─────────────────────────────────────────────────────────────

/** Modules of quiet-zone padding baked into the canvas around QR content. */
export const QUIET_ZONE = 2;

/** Finder patterns are always 7×7 modules. */
export const FINDER_SIZE = 7;

// ── Dot style ──────────────────────────────────────────────────────────

/** Data-dot radius as a fraction of module pitch. */
export const DOT_RADIUS = 0.42;

/**
 * Extra zone (fraction of canvas size) beyond the logo exclusion circle
 * where dots fade out with a smooth ease-in ramp.
 */
export const LOGO_FADE = 0.04;

// ── Decorative ─────────────────────────────────────────────────────────

/** Warm accent for the decorative frame — brand gold at low opacity. */
export const FRAME_COLOR = "rgba(212, 184, 150, 0.12)";

// ── Alignment-pattern positions by QR version (1-20 covers real URLs) ──

const ALIGNMENT_TABLE: Record<number, number[]> = {
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
  11: [6, 30, 54],
  12: [6, 32, 58],
  13: [6, 34, 62],
  14: [6, 26, 46, 66],
  15: [6, 26, 48, 70],
  16: [6, 26, 50, 74],
  17: [6, 30, 54, 78],
  18: [6, 30, 56, 82],
  19: [6, 30, 58, 86],
  20: [6, 34, 62, 90],
};

// ── Geometry helpers ───────────────────────────────────────────────────

/** True when (row, col) falls inside any of the three 7×7 finder patterns. */
export const isInFinder = (r: number, c: number, n: number): boolean =>
  (r < FINDER_SIZE && c < FINDER_SIZE) ||
  (r < FINDER_SIZE && c >= n - FINDER_SIZE) ||
  (r >= n - FINDER_SIZE && c < FINDER_SIZE);

/**
 * Return alignment-pattern center coordinates, excluding any that
 * overlap the three finder-pattern corners.
 */
export const getAlignmentCenters = (n: number): [number, number][] => {
  const version = (n - 17) / 4;
  const pos = ALIGNMENT_TABLE[version];
  if (pos == null) {
    return [];
  }

  const centers: [number, number][] = [];
  for (const r of pos) {
    for (const c of pos) {
      const overlapTL = r <= FINDER_SIZE && c <= FINDER_SIZE;
      const overlapTR = r <= FINDER_SIZE && c >= n - FINDER_SIZE - 1;
      const overlapBL = r >= n - FINDER_SIZE - 1 && c <= FINDER_SIZE;
      if (!overlapTL && !overlapTR && !overlapBL) {
        centers.push([r, c]);
      }
    }
  }
  return centers;
};

/** True when (row, col) falls inside any 5×5 alignment pattern. */
export const isInAlignment = (r: number, c: number, centers: [number, number][]): boolean =>
  centers.some(([cr, cc]) => Math.abs(r - cr) <= 2 && Math.abs(c - cc) <= 2);

// ── Canvas primitives ──────────────────────────────────────────────────

export const fillRRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
): void => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
};

// ── Custom pattern renderers ───────────────────────────────────────────

/**
 * Branded finder pattern — rounded-rect shell → light gap → solid circle core.
 * The concentric shapes echo the Anchr roundel's ring motif.
 */
export const paintFinder = (
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  pitch: number,
  offset: number,
  fg: string,
  bg: string,
): void => {
  const x = offset + col * pitch;
  const y = offset + row * pitch;
  const s = FINDER_SIZE * pitch;

  // Outer shell — softly rounded square
  fillRRect(ctx, x, y, s, s, pitch * 1.2, fg);

  // Light gap — reveals background through the shell
  fillRRect(ctx, x + pitch, y + pitch, s - pitch * 2, s - pitch * 2, pitch * 0.65, bg);

  // Core circle — solid dot at center (covers the inner 3×3 area)
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.arc(x + s / 2, y + s / 2, pitch * 1.5, 0, Math.PI * 2);
  ctx.fill();
};

/**
 * Branded alignment pattern — concentric circles (target / waypoint style).
 */
export const paintAlignment = (
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  pitch: number,
  offset: number,
  fg: string,
  bg: string,
): void => {
  const cx = offset + col * pitch + pitch / 2;
  const cy = offset + row * pitch + pitch / 2;

  // Outer ring
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.arc(cx, cy, pitch * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Light gap
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, pitch * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Center dot
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.arc(cx, cy, pitch * 0.55, 0, Math.PI * 2);
  ctx.fill();
};
