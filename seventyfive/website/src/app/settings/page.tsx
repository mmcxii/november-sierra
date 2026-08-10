import { AppChrome } from "@/components/app-chrome";
import { AccountSettingsForm } from "@/components/settings/account-settings-form";
import { getAuthUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

const SettingsPage = async () => {
  const user = await getAuthUser();
  if (user == null || user.username == null) {
    redirect("/sign-in");
  }

  return (
    <AppChrome>
      <AccountSettingsForm displayName={user.name} timeZone={user.timeZone} username={user.username} />
    </AppChrome>
  );
};

export default SettingsPage;
