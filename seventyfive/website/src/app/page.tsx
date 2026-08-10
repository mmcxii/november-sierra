import { AppChrome } from "@/components/app-chrome";
import { Container } from "@/components/ui/container";
import { getSessionContext } from "@/lib/auth/session";
import { initTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { redirect } from "next/navigation";

const HomePage = async () => {
  const session = await getSessionContext();
  if (session != null) {
    redirect("/team");
  }

  const { t } = await initTranslations();

  return (
    <AppChrome>
      <Container as="main" className="flex min-h-dvh flex-col justify-end pt-24 pb-16">
        <p className="sf-rise text-sf-muted text-base">{t("team")}</p>
        <p className="sf-rise sf-rise-delay-1 font-sf-display text-sf-text text-5xl leading-none tracking-tight md:text-6xl">
          {t("seventyFive")}
        </p>
        <p className="sf-rise sf-rise-delay-2 text-sf-muted mt-4 max-w-sm text-base">
          {t("theQuietPracticeOfShowingUp")}
        </p>
        <div className="sf-rise sf-rise-delay-2 mt-10 flex flex-col gap-3">
          <Link
            className="bg-sf-accent text-sf-accent-text rounded-[var(--sf-radius)] px-4 py-3 text-center text-sm font-medium"
            href="/create"
          >
            {t("createTeam")}
          </Link>
          <Link
            className="border-sf-border bg-sf-elevated text-sf-text rounded-[var(--sf-radius)] border px-4 py-3 text-center text-sm font-medium"
            href="/join"
          >
            {t("joinTeam")}
          </Link>
        </div>
      </Container>
    </AppChrome>
  );
};

export default HomePage;
