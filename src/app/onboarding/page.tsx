import { OnboardingForm } from "@/components/dashboard/onboarding-form";
import { requireUser } from "@/lib/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import * as React from "react";

export const metadata: Metadata = {
  robots: { index: false },
  title: "Onboarding",
};

const OnboardingPage: React.FC = async () => {
  const user = await requireUser();

  if (user.onboardingComplete) {
    redirect("/dashboard");
  }

  return (
    <div className="bg-background text-foreground flex min-h-dvh items-center justify-center p-6">
      <React.Suspense>
        <OnboardingForm defaultUsername={user.username} />
      </React.Suspense>
    </div>
  );
};

export default OnboardingPage;
