"use client";

import { Button } from "@/components/ui/button";
import "./globals.css";
import { Anchor, RefreshCw } from "lucide-react";

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
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a1729] px-6">
          {/* Ambient glow — shifted warm to signal error state */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2d1a1a] opacity-30 blur-[120px]" />

          {/* Content */}
          <div className="relative z-10 flex max-w-md flex-col items-center text-center">
            {/* Anchor icon — tilted to convey "off-kilter" state */}
            <div className="mb-8">
              <div className="flex size-20 -rotate-12 items-center justify-center rounded-2xl border border-[#92b0be]/15 bg-[#1e2d42]/60 shadow-lg shadow-black/20 backdrop-blur-sm">
                <Anchor className="size-9 text-[#92b0be]/60" strokeWidth={1.5} />
              </div>
            </div>

            {/* Error code */}
            <p className="mb-3 font-mono text-sm tracking-[0.3em] text-[#92b0be]">500</p>

            {/* Heading */}
            <h1 className="mb-4 text-2xl font-semibold tracking-tight text-white">Something Went Wrong</h1>

            {/* Description */}
            <p className="mb-10 leading-relaxed text-[#92b0be]/80">
              We hit unexpected waters. Please try again, and if the issue persists, we&apos;re already on it.
            </p>

            {/* CTA */}
            <Button
              className="border border-[#92b0be]/30 bg-[#1e2d42] text-white hover:border-[#92b0be]/50 hover:bg-[#2d3e56]"
              onClick={reset}
              size="lg"
            >
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
};

export default GlobalError;
