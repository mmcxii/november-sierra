import { AppChrome } from "@/components/app-chrome";
import { EntryForm } from "@/components/landing/entry-form";
import { Container } from "@/components/ui/container";
import { getSessionContext } from "@/lib/auth/session";
import { initTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type JoinPageProps = {
  searchParams: Promise<{ code?: string }>;
};

const JoinPage = async (props: JoinPageProps) => {
  const searchParams = await props.searchParams;
  const inviteCode = searchParams.code?.trim() ?? "";
  const session = await getSessionContext();

  // Invite links can still be used to switch teams; otherwise send members home to the board.
  if (session != null && inviteCode === "") {
    redirect("/team");
  }

  const { t } = await initTranslations();

  return (
    <AppChrome>
      <Container as="main" className="min-h-dvh py-10">
        <Link className="text-sf-muted text-sm" href="/">
          {t("teamSeventyfive")}
        </Link>
        <h1 className="font-sf-display mt-6 text-3xl">{t("joinTeam")}</h1>
        <div className="mt-8 w-full">
          <EntryForm hasExistingSession={session != null} initialCode={inviteCode || undefined} mode="join" />
        </div>
      </Container>
    </AppChrome>
  );
};

export default JoinPage;
