import { envSchema } from "@/lib/env";
import { cleanupOldDeliveries } from "@/lib/services/webhook";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${envSchema.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await cleanupOldDeliveries();
    return NextResponse.json({ deleted: result.deleted, status: "ok" });
  } catch (error) {
    console.error("[webhook-cleanup] Failed:", error);
    return NextResponse.json({ error: String(error), status: "error" }, { status: 500 });
  }
}
