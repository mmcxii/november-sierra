"use client";

import { LOGO_RATIO, QR_BACKGROUND, QR_FOREGROUND } from "@/lib/qr";
import QRCodeLib from "qrcode";
import * as React from "react";
import {
  DOT_RADIUS,
  FINDER_SIZE,
  FRAME_COLOR,
  LOGO_FADE,
  QUIET_ZONE,
  getAlignmentCenters,
  isInAlignment,
  isInFinder,
  paintAlignment,
  paintFinder,
} from "./qr-canvas-utils";

export type RoundedQrCanvasProps = {
  bgColor?: string;
  className?: string;
  fgColor?: string;
  level?: "H" | "L" | "M" | "Q";
  size: number;
  style?: React.CSSProperties;
  value: string;
};

export const RoundedQrCanvas = React.forwardRef<HTMLCanvasElement, RoundedQrCanvasProps>((props, ref) => {
  const { bgColor = QR_BACKGROUND, className, fgColor = QR_FOREGROUND, level = "H", size, style, value } = props;

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- ref is always populated before imperative handle callback
  React.useImperativeHandle(ref, () => canvasRef.current!);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas == null) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (ctx == null) {
      return;
    }

    // ── Generate matrix ────────────────────────────────────────────
    const qr = QRCodeLib.create(value, { errorCorrectionLevel: level });
    const n = qr.modules.size;
    const data = qr.modules.data;
    const alignCenters = getAlignmentCenters(n);

    // Pitch accounts for quiet-zone padding on all sides
    const total = n + QUIET_ZONE * 2;
    const pitch = size / total;
    const off = QUIET_ZONE * pitch;

    // Logo exclusion zone (circular, canvas-centered)
    const center = size / 2;
    const logoR = (size * LOGO_RATIO) / 2;
    const fadeEnd = logoR + size * LOGO_FADE;

    canvas.width = size;
    canvas.height = size;

    // ── 1. Background ──────────────────────────────────────────────
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // ── 2. Decorative frame ────────────────────────────────────────
    const fi = pitch * 0.3;
    ctx.strokeStyle = FRAME_COLOR;
    ctx.lineWidth = Math.max(1, pitch * 0.1);
    ctx.beginPath();
    ctx.roundRect(fi, fi, size - fi * 2, size - fi * 2, pitch * 1.5);
    ctx.stroke();

    // ── 3. Data dots ───────────────────────────────────────────────
    ctx.fillStyle = fgColor;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!data[r * n + c]) {
          continue;
        }
        if (isInFinder(r, c, n)) {
          continue;
        }
        if (isInAlignment(r, c, alignCenters)) {
          continue;
        }

        const cx = off + c * pitch + pitch / 2;
        const cy = off + r * pitch + pitch / 2;

        // Logo fade — hard skip inside, smooth shrink at boundary
        const dx = cx - center;
        const dy = cy - center;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < logoR) {
          continue;
        }

        let scale = 1;
        if (dist < fadeEnd) {
          const t = (dist - logoR) / (fadeEnd - logoR);
          scale = t * t; // quadratic ease-in for a smooth ramp
        }

        const dotR = pitch * DOT_RADIUS * scale;
        if (dotR < 0.5) {
          continue;
        }

        ctx.beginPath();
        ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── 4. Finder patterns ─────────────────────────────────────────
    paintFinder(ctx, 0, 0, pitch, off, fgColor, bgColor);
    paintFinder(ctx, 0, n - FINDER_SIZE, pitch, off, fgColor, bgColor);
    paintFinder(ctx, n - FINDER_SIZE, 0, pitch, off, fgColor, bgColor);

    // ── 5. Alignment patterns ──────────────────────────────────────
    for (const [ar, ac] of alignCenters) {
      const acx = off + ac * pitch + pitch / 2;
      const acy = off + ar * pitch + pitch / 2;
      if (Math.hypot(acx - center, acy - center) < logoR) {
        continue;
      }
      paintAlignment(ctx, ar, ac, pitch, off, fgColor, bgColor);
    }
  }, [bgColor, fgColor, level, size, value]);

  // eslint-disable-next-line anchr/no-inline-style -- CSS-scale the canvas to a fixed display size
  return <canvas className={className} ref={canvasRef} style={style} />;
});

RoundedQrCanvas.displayName = "RoundedQrCanvas";
