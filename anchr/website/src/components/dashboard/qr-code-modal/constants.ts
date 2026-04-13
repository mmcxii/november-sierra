import { LOGO_RATIO } from "@/lib/qr";

/** Display size (px) of the QR preview in the modal. */
export const PREVIEW_SIZE = 200;

/** Logo overlay size (px) derived from LOGO_RATIO so preview matches download. */
export const PREVIEW_LOGO_SIZE = Math.round(PREVIEW_SIZE * LOGO_RATIO);
