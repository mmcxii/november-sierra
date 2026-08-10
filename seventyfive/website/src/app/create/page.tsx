import { AppChrome } from "@/components/app-chrome";
import { EntryForm } from "@/components/landing/entry-form";
import { Container } from "@/components/ui/container";
import { getSessionContext } from "@/lib/auth/session";
import { initTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { redirect } from "next/navigation";

const CreatePage = async () => {
  const session = await getSessionContext();
  if (session != null) {
    redirect("/team");
  }

  const { t } = await initTranslations();

  return (
    <AppChrome>
      <Container as="main" className="min-h-dvh py-10">
        <Link className="text-sf-muted text-sm" href="/">
          {t("teamSeventyfive")}
        </Link>
        <h1 className="font-sf-display mt-6 text-3xl">{t("createTeam")}</h1>
        <div className="mt-8 w-full">
          <EntryForm hasExistingSession={false} mode="create" />
        </div>
      </Container>
    </AppChrome>
  );
};

export default CreatePage;
