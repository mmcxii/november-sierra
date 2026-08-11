import { AppChrome } from "@/components/app-chrome";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Container } from "@/components/ui/container";
import { resolveSignedInHomePath } from "@/lib/auth/redirects";
import { getAuthUser } from "@/lib/auth/session";
import { initTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { redirect } from "next/navigation";

const SignInPage = async () => {
  const user = await getAuthUser();
  if (user != null) {
    redirect(await resolveSignedInHomePath());
  }

  const { t } = await initTranslations();

  return (
    <AppChrome>
      <Container as="main" className="flex-1 py-10">
        <Link className="text-sf-muted text-sm" href="/">
          {t("teamSeventyfive")}
        </Link>
        <h1 className="font-sf-display mt-6 text-3xl">{t("signIn")}</h1>
        <div className="mt-8 w-full">
          <SignInForm />
        </div>
      </Container>
    </AppChrome>
  );
};

export default SignInPage;
