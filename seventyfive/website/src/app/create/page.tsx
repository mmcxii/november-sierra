import { AppChrome } from "@/components/app-chrome";
import { EntryForm } from "@/components/landing/entry-form";
import { initTranslations } from "@/lib/i18n/server";
import Link from "next/link";

const CreatePage = async () => {
  const { t } = await initTranslations();

  return (
    <AppChrome>
      <main className="mx-auto min-h-dvh w-full max-w-lg px-6 py-10 pr-16">
        <Link className="text-sf-muted text-sm" href="/">
          {t("teamSeventyfive")}
        </Link>
        <h1 className="font-sf-display mt-6 text-3xl">{t("createTeam")}</h1>
        <div className="mt-8">
          <EntryForm mode="create" />
        </div>
      </main>
    </AppChrome>
  );
};

export default CreatePage;
