import { AppChrome } from "@/components/app-chrome";
import { AccountSettingsForm } from "@/components/settings/account-settings-form";
import { getAuthUser } from "@/lib/auth/session";
import { SITE_URL } from "@/lib/constants";
import { db } from "@/lib/db/client";
import { apiKeysTable } from "@/lib/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";

const SettingsPage = async () => {
  const user = await getAuthUser();
  if (user == null || user.username == null) {
    redirect("/sign-in");
  }

  const keyRows = await db
    .select()
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.userId, user.id), isNull(apiKeysTable.revokedAt)))
    .orderBy(desc(apiKeysTable.createdAt));

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL;

  return (
    <AppChrome>
      <AccountSettingsForm
        apiKeys={keyRows.map((key) => {
          return {
            createdAt: key.createdAt.toISOString(),
            id: key.id,
            keyPrefix: key.keyPrefix,
            keySuffix: key.keySuffix,
            lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
            name: key.name,
          };
        })}
        displayName={user.name}
        mcpUrl={`${baseUrl}/api/v1/mcp`}
        timeZone={user.timeZone}
        username={user.username}
      />
    </AppChrome>
  );
};

export default SettingsPage;
