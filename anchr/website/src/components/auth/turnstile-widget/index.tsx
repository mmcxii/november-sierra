"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import * as React from "react";

type TurnstileWidgetProps = {
  // Cloudflare site key. When this prop is null the widget renders nothing
  // and `onToken` is invoked once on mount with the literal string "skip".
  // This keeps callers from having to branch — they always receive a token
  // value to pass through to BA, and the server-side `captcha` plugin is
  // only registered when the *secret* is set, so a "skip" string never
  // reaches Cloudflare in environments where the gate is enforced.
  siteKey: null | string;
  onError?: () => void;
  onExpire?: () => void;
  onToken: (token: null | string) => void;
};

// Thin wrapper around `@marsidev/react-turnstile` that no-ops when no site
// key is configured. Local dev with Cloudflare's "always passes" test key
// (1x00000000000000000000AA) will render and yield a real token; CI without
// any keys passes through cleanly.
export const TurnstileWidget: React.FC<TurnstileWidgetProps> = (props) => {
  const { onError, onExpire, onToken, siteKey } = props;

  //* Effects
  React.useEffect(() => {
    if (siteKey == null) {
      // No widget → flag callers as ready immediately. The captcha plugin
      // isn't registered without TURNSTILE_SECRET_KEY, so the "skip" sentinel
      // is fine; we never send it to Cloudflare.
      onToken("skip");
    }
    // Run once on mount only — the prop is process-level config, not a
    // value that meaningfully changes across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, []);

  if (siteKey == null) {
    return null;
  }

  return (
    <Turnstile
      onError={onError}
      onExpire={onExpire}
      onSuccess={onToken}
      options={{ size: "flexible", theme: "auto" }}
      siteKey={siteKey}
    />
  );
};
