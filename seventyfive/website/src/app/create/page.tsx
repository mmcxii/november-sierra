import { AppChrome } from "@/components/app-chrome";
import { EntryForm } from "@/components/landing/entry-form";
import { Container } from "@/components/ui/container";
import { getAuthUser } from "@/lib/auth/session";
import { initTranslations } from "@/lib/i18n/server";
import Link from "next/link";

const CreatePage = async () => {
  const user = await getAuthUser();
  const { t } = await initTranslations();

  return (
    <AppChrome>
      <Container as="main" className="flex-1 py-10">
        <Link className="text-sf-muted text-sm" href="/">
          {t("teamSeventyfive")}
        </Link>
        <h1 className="font-sf-display mt-6 text-3xl">{t("createTeam")}</h1>
        <div className="mt-8 w-full">
          <EntryForm
            isSignedIn={user != null}
            mode="create"
            profileDisplayName={user?.name}
            profileTimeZone={user?.timeZone}
          />
        </div>
      </Container>
    </AppChrome>
  );
};

export default CreatePage;
