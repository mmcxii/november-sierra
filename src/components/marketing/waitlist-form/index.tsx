"use client";

import { useActionState, useEffect } from "react";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { joinWaitlist, type WaitlistState } from "@/app/(marketing)/actions";
import { SiteLogo } from "@/components/marketing/site-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: WaitlistState = { success: false };

export const WaitlistForm: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [state, action, isPending] = useActionState(joinWaitlist, initialState);

  useEffect(() => {
    if (state.success) {
      router.push("/welcome");
    }
  }, [state.success, router]);

  const showOverlay = isPending || state.success;

  return (
    <>
      {showOverlay && (
        <div
          aria-label={t("joiningWaitlist")}
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="status"
          style={{ background: `rgb(var(--m-glow) / 0.85)` }}
        >
          <style>{`
            @keyframes sonar {
              0%   { transform: scale(1);   opacity: 0.6; }
              100% { transform: scale(3);   opacity: 0; }
            }
          `}</style>

          {/* Sonar rings */}
          {[0, 0.5, 1].map((delay) => (
            <div
              className="absolute size-28 rounded-full"
              key={delay}
              style={{
                animation: `sonar 2s ease-out infinite`,
                animationDelay: `${delay}s`,
                border: `2px solid rgb(var(--m-accent) / 0.4)`,
              }}
            />
          ))}

          {/* Logo */}
          <SiteLogo size="lg" />
        </div>
      )}

      <form action={action} className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
        <Input
          className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))] placeholder:text-[rgb(var(--m-muted))]/50 focus-visible:border-[rgb(var(--m-accent))]/50 focus-visible:ring-[rgb(var(--m-accent))]/20"
          disabled={isPending}
          name="email"
          placeholder={t("enterYourEmail")}
          required
          type="email"
        />
        <Button
          className="shrink-0 font-semibold tracking-wide transition-opacity hover:opacity-90"
          disabled={isPending}
          style={{
            background: `rgb(var(--m-accent))`,
            color: `var(--m-page-bg)`,
          }}
          type="submit"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : t("joinTheWaitlist")}
        </Button>
        {state.error && (
          <p className="text-xs sm:absolute sm:top-full sm:mt-2" style={{ color: `rgb(var(--m-accent))` }}>
            {t(state.error)}
          </p>
        )}
      </form>
    </>
  );
};
