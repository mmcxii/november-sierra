import { envSchema } from "@/lib/env";
import { initTranslations } from "@/lib/i18n/server";
import { processDailyReminders } from "@/lib/push/process-daily-reminders";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET(request: Request) {
  if (envSchema.CRON_SECRET == null) {
    return Response.json(
      { error: "CRON_SECRET not configured", ok: false },
      { headers: NO_STORE_HEADERS, status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${envSchema.CRON_SECRET}`) {
    return new Response("Unauthorized", { headers: NO_STORE_HEADERS, status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dryRun") === "1";
  const { t } = await initTranslations();
  const result = await processDailyReminders({ dryRun, t });

  return Response.json(
    {
      ...result,
      dryRun,
      schedule: request.headers.get("x-vercel-cron-schedule"),
      triggeredAt: new Date().toISOString(),
    },
    { headers: NO_STORE_HEADERS },
  );
}
