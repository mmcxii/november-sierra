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
export NEXT_PUBLIC_SHORT_DOMAIN="test.short.domain"

# Server
export DATABASE_URL="postgresql://mock:mock@localhost:5432/mock"
export CLERK_SECRET_KEY="sk_test_mock"
export CLERK_WEBHOOK_SECRET="whsec_mock"
export STRIPE_SECRET_KEY="sk_test_mock"
export STRIPE_WEBHOOK_SECRET="whsec_mock"
export STRIPE_PRO_PRICE_ID_MONTHLY="price_mock_monthly"
export STRIPE_PRO_PRICE_ID_ANNUAL="price_mock_annual"
export UPLOADTHING_TOKEN="mock"
export RESEND_API_KEY="re_mock"
export UPSTASH_REDIS_REST_URL="https://mock.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="mock"
export VERCEL_API_TOKEN="mock"
export VERCEL_PROJECT_ID="mock"
export CRON_SECRET="mock"
export WEBHOOK_SIGNING_ENCRYPTION_KEY="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

# ─── Build ────────────────────────────────────────────────────────────────────
echo "▸ Building project…"
pnpm build

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
