import { AppChrome } from "@/components/app-chrome";
import { EntryForm } from "@/components/landing/entry-form";
import { Container } from "@/components/ui/container";
import { getSessionMemberId } from "@/lib/auth/session";
import { initTranslations } from "@/lib/i18n/server";
import Link from "next/link";

type JoinPageProps = {
  searchParams: Promise<{ code?: string }>;
};

const JoinPage = async (props: JoinPageProps) => {
  const { t } = await initTranslations();
  const searchParams = await props.searchParams;
  const memberId = await getSessionMemberId();

  return (
    <AppChrome>
      <Container as="main" className="min-h-dvh py-10">
        <Link className="text-sf-muted text-sm" href="/">
          {t("teamSeventyfive")}
        </Link>
        <h1 className="font-sf-display mt-6 text-3xl">{t("joinTeam")}</h1>
        <div className="mt-8 w-full">
          <EntryForm hasExistingSession={memberId != null} initialCode={searchParams.code} mode="join" />
        </div>
      </Container>
    </AppChrome>
  );
};

export default JoinPage;
