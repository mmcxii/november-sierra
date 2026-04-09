import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    deployedAt: process.env.BUILD_TIMESTAMP ?? null,
  });
}
