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
    <SettingsForm
      displayName={session.member.displayName}
      mode={session.member.mode as ChallengeMode}
      reminderEnabled={session.member.reminderEnabled}
      reminderTime={session.member.reminderTime}
      startPassed={hasStartPassed(session.group.startDate, formatDateOnly(new Date()))}
      timeZone={session.member.timeZone}
      vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
    />
  );
};

export default SettingsPage;
