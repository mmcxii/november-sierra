#!/usr/bin/env bash
set -euo pipefail

# ─── Mock environment variables ───────────────────────────────────────────────
# These satisfy @t3-oss/env-nextjs validation so the app can build and start.
# None of these values are real credentials.

# Client (NEXT_PUBLIC_)
export NEXT_PUBLIC_APP_URL="http://localhost:3000"
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_bW9jay5jbGVyay5hY2NvdW50cy5kZXYk"
export NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
export NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
export NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
export NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_mock"
export NEXT_PUBLIC_POSTHOG_KEY="phc_mock"
export NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"

# Server
export DATABASE_URL="postgresql://mock:mock@localhost:5432/mock"
export CLERK_SECRET_KEY="sk_test_mock"
export CLERK_WEBHOOK_SECRET="whsec_mock"
export STRIPE_SECRET_KEY="sk_test_mock"
export STRIPE_WEBHOOK_SECRET="whsec_mock"
export STRIPE_PRO_PRICE_ID="price_mock"
export UPLOADTHING_TOKEN="mock"
export RESEND_API_KEY="re_mock"
export UPSTASH_REDIS_REST_URL="https://mock.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="mock"
export VERCEL_API_TOKEN="mock"
export VERCEL_PROJECT_ID="mock"

# ─── Build ────────────────────────────────────────────────────────────────────
echo "▸ Building project…"
pnpm build

# ─── Start server in background ──────────────────────────────────────────────
echo "▸ Starting production server…"
pnpm start &
SERVER_PID=$!

cleanup() {
  echo "▸ Stopping server (PID $SERVER_PID)…"
  kill "$SERVER_PID" 2>/dev/null || true
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
