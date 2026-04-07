import { envSchema } from "@/lib/env";
import { retryDeletionCleanup } from "@/lib/services/account-deletion-cleanup";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${envSchema.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await retryDeletionCleanup();
    return NextResponse.json({ ...result, status: "ok" });
  } catch (error) {
    console.error("[deletion-cleanup] Failed:", error);
    return NextResponse.json({ error: String(error), status: "error" }, { status: 500 });
  }
}
