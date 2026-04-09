#!/usr/bin/env bash
set -euo pipefail

# ─── Mock environment variables ───────────────────────────────────────────────
# These satisfy @t3-oss/env-nextjs validation so the app can build and start.
# None of these values are real credentials.

export NEXT_PUBLIC_APP_URL="http://localhost:3001"
export RESEND_API_KEY="re_mock"
export CONTACT_EMAIL_TO="mock@example.com"
export CONTACT_EMAIL_FROM="mock@example.com"

# ─── Build ────────────────────────────────────────────────────────────────────
echo "▸ Building project…"
pnpm build

# ─── Start server in background ──────────────────────────────────────────────
echo "▸ Starting production server…"
PORT=3001 pnpm start &
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

  if curl -sf -o /dev/null http://localhost:3001; then
    echo "✔ Site is up on http://localhost:3001"
    exit 0
  fi

  DELAY=$(( DELAY * 2 ))
done

echo "✘ Site failed to respond after $MAX_ATTEMPTS attempts"
exit 1
