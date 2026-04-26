// Public Turnstile site key — set in Vercel for stage/prod, optional locally.
// Both sign-up and forgot-password forms read from this single export so the
// env-name dependency lives in one place.
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;
