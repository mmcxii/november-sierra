const commitSha = process.env.VERCEL_GIT_COMMIT_SHA ?? null;
const deployedAt = process.env.BUILD_TIMESTAMP ?? null;

export function GET() {
  return Response.json({ commitSha, deployedAt });
}
