// Mock URLs for the homepage + /short-links hero visual. The long URL is a
// deliberately messy marketing link (UTM-tagged campaign) so the visual
// payoff — the clean `anch.to/slug` replacement — feels earned. Neither URL
// needs to resolve; they're illustrative.
export const LONG_URL = "https://example.com/summer-launch?utm_source=newsletter&utm_campaign=2026";
export const SHORT_URL = "anch.to/launch";

// Timings (ms). Typing-slower-than-deleting matches natural "oh wait, let me
// fix that" rhythm, and the longer pause on the short URL gives the viewer
// time to appreciate the payoff before the loop restarts.
export const TYPE_SPEED_MS = 40;
export const DELETE_SPEED_MS = 20;
export const PAUSE_LONG_MS = 1500;
export const PAUSE_SHORT_MS = 2500;

export type Phase = "deleting-long" | "deleting-short" | "pause-long" | "pause-short" | "typing-long" | "typing-short";
