"use client";

import { joinWaitlist } from "@/app/(marketing)/actions";
import { SiteLogo } from "@/components/marketing/site-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type WaitlistValues, waitlistSchema } from "@/lib/schemas/waitlist";
import { cn } from "@/lib/utils";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { INITIAL_STATE } from "./constants";

export const WaitlistForm: React.FC = () => {
  //* State
  const { t } = useTranslation();
  const router = useRouter();
  const posthog = usePostHog();
  const [serverState, setServerState] = React.useState(INITIAL_STATE);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<WaitlistValues>({ resolver: standardSchemaResolver(waitlistSchema) });

  //* Variables
  const showOverlay = isSubmitting || serverState.success;

  //* Handlers
  const onSubmit = async (data: WaitlistValues) => {
    const formData = new FormData();
    formData.set("email", data.email);

    const result = await joinWaitlist(INITIAL_STATE, formData);
    setServerState(result);

    if (result.success != null) {
      posthog.capture("waitlist_signup");
      router.push("/welcome");
    } else if (result.error != null) {
      setError("email", { message: t(result.error) });
    }
  };

  return (
    <>
      {showOverlay && (
        <div
          aria-label={t("joiningWaitlist")}
          className="m-waitlist-overlay fixed inset-0 z-50 flex items-center justify-center"
          role="status"
        >
          {/* Sonar rings */}
          {["[animation-delay:0s]", "[animation-delay:0.5s]", "[animation-delay:1s]"].map((delayClass) => (
            <div
              className={cn(
                "m-sonar-ring absolute size-28 [animation:sonar_2s_ease-out_infinite] rounded-full",
                delayClass,
              )}
              key={delayClass}
            />
          ))}

          {/* Logo */}
          <SiteLogo size="lg" />
        </div>
      )}

      <form className="flex w-full max-w-sm flex-col gap-2 sm:flex-row" onSubmit={handleSubmit(onSubmit)}>
        <Input
          className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))] placeholder:text-[rgb(var(--m-muted))]/50 focus-visible:border-[rgb(var(--m-accent))]/50 focus-visible:ring-[rgb(var(--m-accent))]/20"
          disabled={isSubmitting}
          placeholder={t("enterYourEmail")}
          type="email"
          {...register("email")}
        />
        <Button className="shrink-0 font-semibold tracking-wide" disabled={isSubmitting} type="submit">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : t("joinTheWaitlist")}
        </Button>
        {errors.email != null && (
          <p className="m-accent-color text-xs sm:absolute sm:top-full sm:mt-2">{errors.email.message}</p>
        )}
      </form>
    </>
  );
};
