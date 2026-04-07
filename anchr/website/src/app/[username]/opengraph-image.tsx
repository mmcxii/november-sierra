/* eslint-disable anchr/no-inline-style, anchr/no-raw-string-jsx */
import type { ThemeVariables } from "@/lib/custom-themes";
import { db } from "@/lib/db/client";
import { customThemesTable } from "@/lib/db/schema/custom-theme";
import { usersTable } from "@/lib/db/schema/user";
import { getTheme } from "@/lib/themes";
import { deriveOgColorsFromVariables, isCustomThemeId } from "@/lib/utils/custom-theme";
import { eq } from "drizzle-orm";
import { ImageResponse } from "next/og";

export const alt = "User profile on Anchr";
export const contentType = "image/png";
export const dynamic = "force-dynamic";
export const size = { height: 630, width: 1200 };

const GEIST_BOLD_URL = "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-700-normal.woff";
const GEIST_REGULAR_URL = "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-400-normal.woff";

type Params = { username: string };

export default async function UserOpenGraphImage(props: { params: Promise<Params> }) {
  const { username } = await props.params;

  const users = await db.select().from(usersTable).where(eq(usersTable.username, username.toLowerCase())).limit(1);
  const user = users[0];

  if (user == null) {
    return new Response(null, { status: 404 });
  }

  // Resolve theme colors — support custom themes with safe fallback
  let ogColors:
    | undefined
    | { anchorColor: string; avatarBg: string; avatarOuterRing: string; nameColor: string; ogBackground: string };

  if (isCustomThemeId(user.pageDarkTheme)) {
    const [ct] = await db.select().from(customThemesTable).where(eq(customThemesTable.id, user.pageDarkTheme)).limit(1);
    if (ct != null) {
      ogColors = deriveOgColorsFromVariables(ct.variables as ThemeVariables);
    }
  }

  // Fall back to preset (handles both preset IDs and deleted custom themes)
  if (ogColors == null) {
    const preset = getTheme(user.pageDarkTheme);
    ogColors = {
      anchorColor: preset.anchorColor,
      avatarBg: preset.avatarBg,
      avatarOuterRing: preset.avatarOuterRing,
      nameColor: preset.nameColor,
      ogBackground: preset.ogBackground,
    };
  }

  const theme = ogColors;
  const bg = theme.ogBackground;
  const displayName = user.displayName ?? user.username;

  const [geistBold, geistRegular] = await Promise.all([
    fetch(GEIST_BOLD_URL).then((res) => res.arrayBuffer()),
    fetch(GEIST_REGULAR_URL).then((res) => res.arrayBuffer()),
  ]);

  const avatar =
    user.avatarUrl != null ? (
      <img alt="" height={180} src={user.avatarUrl} style={{ objectFit: "cover" }} width={180} />
    ) : (
      <div
        style={{
          alignItems: "center",
          background: theme.avatarBg,
          borderRadius: "50%",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <svg
          fill="none"
          height="80"
          stroke={theme.anchorColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          width="80"
        >
          <path d="M12 6v16" />
          <path d="m19 13 2-1a9 9 0 0 1-18 0l2 1" />
          <path d="M9 11h6" />
          <circle cx="12" cy="4" r="2" />
        </svg>
      </div>
    );

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: bg,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Geist Sans",
        height: "100%",
        justifyContent: "center",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          border: `3px solid ${theme.avatarOuterRing}`,
          borderRadius: "50%",
          display: "flex",
          height: 180,
          justifyContent: "center",
          overflow: "hidden",
          width: 180,
        }}
      >
        {avatar}
      </div>

      <div
        style={{
          color: theme.nameColor,
          display: "flex",
          fontSize: 52,
          fontWeight: 700,
          marginTop: 32,
        }}
      >
        {displayName}
      </div>

      <div
        style={{
          color: theme.anchorColor,
          display: "flex",
          fontSize: 28,
          fontWeight: 400,
          marginTop: 8,
        }}
      >
        @{user.username}
      </div>

      <div
        style={{
          alignItems: "center",
          bottom: 32,
          color: theme.anchorColor,
          display: "flex",
          gap: 10,
          opacity: 0.5,
          position: "absolute",
          right: 40,
        }}
      >
        <svg
          fill="none"
          height="20"
          stroke={theme.anchorColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          width="20"
        >
          <path d="M12 6v16" />
          <path d="m19 13 2-1a9 9 0 0 1-18 0l2 1" />
          <path d="M9 11h6" />
          <circle cx="12" cy="4" r="2" />
        </svg>
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.3em" }}>ANCHR</span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { data: geistBold, name: "Geist Sans", style: "normal", weight: 700 },
        { data: geistRegular, name: "Geist Sans", style: "normal", weight: 400 },
      ],
    },
  );
}
