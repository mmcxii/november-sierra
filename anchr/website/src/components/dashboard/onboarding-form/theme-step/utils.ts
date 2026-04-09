import { redeemReferralCode } from "@/app/(dashboard)/dashboard/settings/actions";
import { type CompleteOnboardingResult, completeOnboarding } from "@/app/onboarding/actions";

/**
 * When a referral code is present, redeem it first (without marking onboarding
 * complete) so the celebration overlay can render before the server-side
 * `onboardingComplete` guard redirects to /dashboard. Onboarding is completed
 * later when the celebration is dismissed.
 */
export async function finishOnboarding(
  referralCode: undefined | string,
  callback: (referral?: CompleteOnboardingResult["referral"]) => void,
): Promise<void> {
  if (referralCode != null && referralCode.length > 0) {
    const result = await redeemReferralCode(referralCode);
    if (result.success) {
      callback({ durationDays: result.durationDays, referrerName: result.referrerName });
      return;
    }
    console.error(`[finishOnboarding] referral code redemption failed: ${result.error}`);
  }
  await completeOnboarding();
  callback();
}
