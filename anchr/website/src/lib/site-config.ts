import { envSchema } from "@/lib/env";

function resolveEnvironment(): "development" | "production" | "stage" {
  try {
    const hostname = new URL(envSchema.NEXT_PUBLIC_APP_URL).hostname;

    if (hostname === "anchr.to" || hostname === "www.anchr.to") {
      return "production";
    }

    if (hostname.endsWith(".anchr.to")) {
      return "stage";
    }
  } catch {
    // Invalid URL — fall through to development
  }

  return "development";
}

export const siteConfig = {
  environment: resolveEnvironment(),
};
