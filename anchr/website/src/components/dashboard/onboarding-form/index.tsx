"use client";

import { completeOnboarding, type CompleteOnboardingResult } from "@/app/onboarding/actions";
import { CheckoutCelebration } from "@/components/dashboard/checkout-celebration";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { CompleteStep } from "./complete-step";
import { LinkStep } from "./link-step";
import { ProgressIndicator } from "./progress-indicator";
import { ThemeStep } from "./theme-step";
import { UsernameStep } from "./username-step";
import { type Step, STEPS } from "./utils";

export type OnboardingFormProps = {
  defaultUsername: string;
};

export const OnboardingForm: React.FC<OnboardingFormProps> = (props) => {
  const { defaultUsername } = props;

  //* State
  const router = useRouter();
  const searchParams = useSearchParams();
  const [referralData, setReferralData] = React.useState<CompleteOnboardingResult["referral"]>();

  //* Variables
  const stepParam = searchParams.get("step");
  const currentStep: Step = STEPS.includes(stepParam as Step) ? (stepParam as Step) : "username";
  const stepIndex = STEPS.indexOf(currentStep);

  //* Handlers
  const goToStep = (step: Step) => {
    router.push(`/onboarding?step=${step}`);
  };

  const handleUsernameStepOnComplete = () => goToStep("link");

  const handleLinkStepOnComplete = () => goToStep("theme");

  const handleLinkStepOnSkip = () => goToStep("theme");

  const handleThemeStepOnDone = (referral?: CompleteOnboardingResult["referral"]) => {
    if (referral != null) {
      // Referral was redeemed but onboarding is NOT yet marked complete — that
      // happens when the celebration is dismissed. This avoids the server-side
      // onboardingComplete guard redirecting to /dashboard prematurely.
      setReferralData(referral);
    } else {
      // No referral — onboarding was already marked complete by the theme step,
      // server auto-refresh will redirect to /dashboard via the page guard.
      goToStep("complete");
    }
  };

  const handleCelebrationDismiss = async () => {
    // Now mark onboarding complete — the server redirect to /dashboard is intentional.
    await completeOnboarding();
    router.push("/dashboard");
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      {currentStep !== "complete" && <ProgressIndicator stepIndex={stepIndex} />}

      {currentStep === "username" && (
        <UsernameStep defaultUsername={defaultUsername} onComplete={handleUsernameStepOnComplete} />
      )}
      {currentStep === "link" && <LinkStep onComplete={handleLinkStepOnComplete} onSkip={handleLinkStepOnSkip} />}
      {currentStep === "theme" && <ThemeStep onComplete={handleThemeStepOnDone} onSkip={handleThemeStepOnDone} />}
      {currentStep === "complete" && <CompleteStep />}
      {referralData != null && (
        <CheckoutCelebration onOpenChange={handleCelebrationDismiss} open={true} referral={referralData} />
      )}
    </div>
  );
};
