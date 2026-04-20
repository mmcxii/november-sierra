#!/usr/bin/env bash
set -euo pipefail

# ─── Mock environment variables ───────────────────────────────────────────────
# These satisfy @t3-oss/env-nextjs validation so the app can build and start.
# None of these values are real credentials.
#
# Server-only mock values embed a unique per-key sentinel so the client-chunk
# scanner can detect regressions of ANC-191 — if a server secret is ever
# inlined into the client bundle again, the mock value will show up in
# .next/static/chunks and the scanner will fail with the exact env var name.

# Client (NEXT_PUBLIC_) — these are expected to appear in client chunks
export NEXT_PUBLIC_APP_URL="http://localhost:3000"
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_bW9jay5jbGVyay5hY2NvdW50cy5kZXYk"
export NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
export NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
export NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
export NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_mock"
export NEXT_PUBLIC_POSTHOG_KEY="phc_mock"
export NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
export NEXT_PUBLIC_SHORT_DOMAIN="test.short.domain"

# Server — each value embeds VALIDATE_BUILD_SERVER_ONLY__<KEY> so the scanner
# can pinpoint which env var leaked if one appears in a client chunk.
export ADMIN_USER_ID="VALIDATE_BUILD_SERVER_ONLY__ADMIN_USER_ID"
# length>=32 required; sentinel is 44 chars, comfortably above the minimum
export BETTER_AUTH_SECRET="VALIDATE_BUILD_SERVER_ONLY__BETTER_AUTH_SECRET"
export CLERK_SECRET_KEY="sk_test_VALIDATE_BUILD_SERVER_ONLY__CLERK_SECRET_KEY"
export CLERK_WEBHOOK_SECRET="whsec_VALIDATE_BUILD_SERVER_ONLY__CLERK_WEBHOOK_SECRET"
export CRON_SECRET="VALIDATE_BUILD_SERVER_ONLY__CRON_SECRET"
export DATABASE_URL="postgresql://mock:VALIDATE_BUILD_SERVER_ONLY__DATABASE_URL@localhost:5432/mock"
export RESEND_API_KEY="re_VALIDATE_BUILD_SERVER_ONLY__RESEND_API_KEY"
export STRIPE_PRO_PRICE_ID_ANNUAL="price_VALIDATE_BUILD_SERVER_ONLY_STRIPE_PRO_PRICE_ID_ANNUAL"
export STRIPE_PRO_PRICE_ID_MONTHLY="price_VALIDATE_BUILD_SERVER_ONLY_STRIPE_PRO_PRICE_ID_MONTHLY"
export STRIPE_SECRET_KEY="sk_test_VALIDATE_BUILD_SERVER_ONLY__STRIPE_SECRET_KEY"
export STRIPE_WEBHOOK_SECRET="whsec_VALIDATE_BUILD_SERVER_ONLY__STRIPE_WEBHOOK_SECRET"
export UPLOADTHING_TOKEN="VALIDATE_BUILD_SERVER_ONLY__UPLOADTHING_TOKEN"
export UPSTASH_REDIS_REST_TOKEN="VALIDATE_BUILD_SERVER_ONLY__UPSTASH_REDIS_REST_TOKEN"
export UPSTASH_REDIS_REST_URL="https://mock.upstash.io/VALIDATE_BUILD_SERVER_ONLY__UPSTASH_REDIS_REST_URL"
export VERCEL_API_TOKEN="VALIDATE_BUILD_SERVER_ONLY__VERCEL_API_TOKEN"
export VERCEL_PROJECT_ID="VALIDATE_BUILD_SERVER_ONLY__VERCEL_PROJECT_ID"
# length(64) required; padded from 58 → 64 with 6 underscores
export WEBHOOK_SIGNING_ENCRYPTION_KEY="VALIDATE_BUILD_SERVER_ONLY__WEBHOOK_SIGNING_ENCRYPTION_KEY______"

# ─── Build ────────────────────────────────────────────────────────────────────
echo "▸ Building project…"
pnpm build

# ─── Scan client chunks for server-only env values ───────────────────────────
# Guards against ANC-191 regressions: if any envSchema.server value is inlined
# into .next/static/chunks, this step fails with the leaking key + file.
echo "▸ Scanning client chunks for server-only env values…"
node --no-warnings --experimental-strip-types scripts/scan-client-chunks-for-server-secrets.ts

# ─── Start server in background ──────────────────────────────────────────────
echo "▸ Starting production server…"
pnpm start &
SERVER_PID=$!

kill_tree() {
  local pid=$1
  # Kill children first (recursive), then the process itself
  for child in $(pgrep -P "$pid" 2>/dev/null); do
    kill_tree "$child"
  done
  kill "$pid" 2>/dev/null || true
}

cleanup() {
  echo "▸ Stopping server (PID $SERVER_PID)…"
  kill_tree "$SERVER_PID"
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

# ─── Health check with exponential back-off ──────────────────────────────────
MAX_ATTEMPTS=6
DELAY=2

for (( i=1; i<=MAX_ATTEMPTS; i++ )); do
  echo "▸ Health check attempt $i/$MAX_ATTEMPTS (waiting ${DELAY}s)…"
  sleep "$DELAY"

  if curl -sf -o /dev/null http://localhost:3000; then
    echo "✔ Site is up on http://localhost:3000"
    exit 0
  fi

  DELAY=$(( DELAY * 2 ))
done

echo "✘ Site failed to respond after $MAX_ATTEMPTS attempts"
exit 1
