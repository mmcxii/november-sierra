import { type ApiKeyRow, ApiKeysClient } from "@/components/dashboard/api-keys/api-keys-client";
import { type WebhookRow, WebhooksClient } from "@/components/dashboard/webhooks/webhooks-client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { apiKeysTable } from "@/lib/db/schema/api-key";
import { webhooksTable } from "@/lib/db/schema/webhook";
import { initTranslations } from "@/lib/i18n/server";
import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "API",
};

const ApiPage: React.FC = async () => {
  const user = await requireUser();
  const { t } = await initTranslations();

  const [keys, webhooks] = await Promise.all([
    db.select().from(apiKeysTable).where(eq(apiKeysTable.userId, user.id)).orderBy(desc(apiKeysTable.createdAt)),
    db.select().from(webhooksTable).where(eq(webhooksTable.userId, user.id)).orderBy(desc(webhooksTable.createdAt)),
  ]);

  const serializedKeys: ApiKeyRow[] = keys.map((key) => ({
    createdAt: key.createdAt.toISOString(),
    id: key.id,
    keyPrefix: key.keyPrefix,
    keySuffix: key.keySuffix,
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    name: key.name,
    revokedAt: key.revokedAt?.toISOString() ?? null,
  }));

  const serializedWebhooks: WebhookRow[] = webhooks.map((w) => ({
    active: w.active,
    consecutiveFailures: w.consecutiveFailures,
    createdAt: w.createdAt.toISOString(),
    events: w.events,
    id: w.id,
    url: w.url,
  }));

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="mb-6 text-2xl font-bold">{t("api")}</h1>
        <ApiKeysClient keys={serializedKeys} />
      </div>
      <div>
        <h2 className="mb-6 text-xl font-bold">{t("webhooks")}</h2>
        <WebhooksClient webhooks={serializedWebhooks} />
      </div>
    </div>
  );
};

export default ApiPage;
