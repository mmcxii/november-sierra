import { AppChrome } from "@/components/app-chrome";
import { Container } from "@/components/ui/container";
import { getAuthUser, listMembershipsForUser } from "@/lib/auth/session";
import { initTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { redirect } from "next/navigation";

const TeamsPage = async () => {
  const user = await getAuthUser();
  if (user == null) {
    redirect("/sign-in");
  }

  const memberships = await listMembershipsForUser(user.id);
  const { t } = await initTranslations();

  return (
    <AppChrome>
      <Container as="main" className="min-h-dvh py-8">
        <h1 className="font-sf-display text-3xl">{t("yourTeams")}</h1>
        {memberships.length === 0 ? (
          <p className="text-sf-muted mt-8 text-sm">{t("youAreNotOnATeamYet")}</p>
        ) : (
          <ul className="divide-sf-border mt-8 divide-y">
            {memberships.map((row) => {
              return (
                <li key={row.team.id}>
                  <Link className="block py-4 text-lg" href={`/teams/${row.team.id}`}>
                    {row.team.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-8 flex flex-col gap-3">
          <Link
            className="bg-sf-accent text-sf-accent-text block rounded-[var(--sf-radius)] px-4 py-3 text-center text-sm"
            href="/create"
          >
            {t("createTeam")}
          </Link>
          <Link
            className="border-sf-border block rounded-[var(--sf-radius)] border px-4 py-3 text-center text-sm"
            href="/join"
          >
            {t("joinTeam")}
          </Link>
        </div>
        <div className="mt-10 flex gap-4 text-sm">
          <Link className="text-sf-muted underline" href="/settings">
            {t("settings")}
          </Link>
        </div>
      </Container>
    </AppChrome>
  );
};

export default TeamsPage;
