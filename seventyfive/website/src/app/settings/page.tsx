import { AppChrome } from "@/components/app-chrome";
import { SettingsForm } from "@/components/settings/settings-form";
import { getSessionContext } from "@/lib/auth/session";
import { formatDateOnly, hasStartPassed, type ChallengeMode } from "@/lib/challenge/tasks";
import { redirect } from "next/navigation";

const SettingsPage = async () => {
  const session = await getSessionContext();
  if (session == null) {
    redirect("/");
  }

  return (
    <AppChrome>
      <SettingsForm
        displayName={session.member.displayName}
        isOwner={session.member.isOwner}
        mode={session.member.mode as ChallengeMode}
        reminderEnabled={session.member.reminderEnabled}
        reminderTime={session.member.reminderTime}
        startPassed={hasStartPassed(session.team.startDate, formatDateOnly(new Date()))}
        timeZone={session.member.timeZone}
        vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
      />
    </AppChrome>
  );
};

export default SettingsPage;
