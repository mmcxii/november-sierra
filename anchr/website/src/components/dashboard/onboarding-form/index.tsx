"use client";

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

  const handleThemeStepOnComplete = () => goToStep("complete");

  const handleThemeStepOnSkip = () => goToStep("complete");

  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      {currentStep !== "complete" && <ProgressIndicator stepIndex={stepIndex} />}

      {currentStep === "username" && (
        <UsernameStep defaultUsername={defaultUsername} onComplete={handleUsernameStepOnComplete} />
      )}
      {currentStep === "link" && <LinkStep onComplete={handleLinkStepOnComplete} onSkip={handleLinkStepOnSkip} />}
      {currentStep === "theme" && <ThemeStep onComplete={handleThemeStepOnComplete} onSkip={handleThemeStepOnSkip} />}
      {currentStep === "complete" && <CompleteStep />}
    </div>
  );
};
