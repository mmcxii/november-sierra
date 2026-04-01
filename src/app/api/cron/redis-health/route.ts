import { envSchema } from "@/lib/env";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const HEALTH_KEY = "health:ping";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (envSchema.CRON_SECRET == null || authHeader !== `Bearer ${envSchema.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const redis = new Redis({
    token: envSchema.UPSTASH_REDIS_REST_TOKEN,
    url: envSchema.UPSTASH_REDIS_REST_URL,
  });

  const start = Date.now();

  try {
    const timestamp = String(Date.now());
    await redis.set(HEALTH_KEY, timestamp, { ex: 60 });
    const value = await redis.get(HEALTH_KEY);

    if (value !== timestamp) {
      return NextResponse.json({ latencyMs: Date.now() - start, status: "error" }, { status: 503 });
    }

    return NextResponse.json({ latencyMs: Date.now() - start, status: "ok" });
  } catch (error) {
    console.error("[redis-health] Health check failed:", error);
    return NextResponse.json({ error: String(error), latencyMs: Date.now() - start, status: "error" }, { status: 503 });
  }
}
