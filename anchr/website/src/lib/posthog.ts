import { envSchema } from "@/lib/env";
import posthog from "posthog-js";

export const posthogClient = posthog.init(envSchema.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: envSchema.NEXT_PUBLIC_POSTHOG_HOST,
  capture_pageleave: true,
  capture_pageview: false,
});

if (typeof window !== "undefined" && localStorage.getItem("cookie-consent") === "rejected") {
  posthogClient?.opt_out_capturing();
}
