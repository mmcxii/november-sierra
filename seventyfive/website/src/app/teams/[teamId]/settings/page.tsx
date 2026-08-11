import { AppChrome } from "@/components/app-chrome";
import { TeamSettingsForm } from "@/components/settings/team-settings-form";
import { getMembershipContext } from "@/lib/auth/session";
import { hasStartPassed, localDateString, type ChallengeMode } from "@/lib/challenge/tasks";
import { redirect } from "next/navigation";

type TeamSettingsPageProps = {
  params: Promise<{ teamId: string }>;
};

const TeamSettingsPage = async (props: TeamSettingsPageProps) => {
  const { teamId } = await props.params;
  const session = await getMembershipContext(teamId);
  if (session == null) {
    redirect("/teams");
  }

  const todayLocal = localDateString(new Date(), session.user.timeZone);

  return (
    <AppChrome>
      <TeamSettingsForm
        endDate={session.team.endDate}
        isOwner={session.member.isOwner}
        mode={session.member.mode as ChallengeMode}
        reminderEnabled={session.member.reminderEnabled}
        reminderTime={session.member.reminderTime}
        startDate={session.team.startDate}
        startPassed={hasStartPassed(session.team.startDate, todayLocal)}
        teamId={session.team.id}
        teamName={session.team.name}
        todayLocal={todayLocal}
        vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
      />
    </AppChrome>
  );
};

export default TeamSettingsPage;
