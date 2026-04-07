"use client";

import { SiteLogo } from "@/components/marketing/site-logo";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import "./globals.css";

export type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Handles errors from the root layout (e.g. app/layout.tsx). Replaces the entire
 * root layout when it runs, so it must define <html>/<body> and cannot use
 * providers (TranslationsProvider, ClerkProvider, etc.). Copy is hardcoded in
 * English to match en-US.json.
 */
const GlobalError: React.FC<GlobalErrorProps> = (props) => {
  const { reset } = props;

  return (
    <html lang="en">
      <body className="antialiased">
        <div
          className="bg-anc-deep-navy relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
          data-marketing-theme="dark"
        >
          {/* Ambient glow — shifted warm to signal error state */}
          <div className="bg-anc-error-glow pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[120px]" />

          {/* Content */}
          <div className="relative z-10 flex max-w-md flex-col items-center text-center">
            {/* Logo — tilted to convey "off-kilter" state */}
            <div className="mb-8">
              <SiteLogo accent="146 176 190" cardBg="rgba(30, 45, 66, 0.6)" className="-rotate-12" />
            </div>

            {/* Error code */}
            <p className="text-anc-steel tracking-anc-caps mb-3 font-mono text-sm">500</p>

            {/* Heading */}
            {/* eslint-disable-next-line anchr/no-raw-string-jsx -- error boundary renders before i18n loads */}
            <h1 className="text-anc-cream mb-4 text-2xl font-semibold tracking-tight">Something Went Wrong</h1>

            {/* Description */}
            {/* eslint-disable-next-line anchr/no-raw-string-jsx -- error boundary renders before i18n loads */}
            <p className="text-anc-steel/80 mb-10 leading-relaxed">
              We hit unexpected waters. Please try again, and if the issue persists, we&apos;re already on it.
            </p>

            {/* CTA */}
            {/* eslint-disable anchr/no-raw-string-jsx -- error boundary renders before i18n loads */}
            <Button onClick={reset} size="lg">
              <RefreshCw className="size-4" />
              Try again
            </Button>
            {/* eslint-enable anchr/no-raw-string-jsx */}
          </div>
        </div>
      </body>
    </html>
  );
};

export default GlobalError;
