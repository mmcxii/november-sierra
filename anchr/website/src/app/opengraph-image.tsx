/* eslint-disable anchr/no-inline-style, anchr/no-raw-string-jsx */
import { ImageResponse } from "next/og";

export const alt = "Anchr — Your Harbor for Every Connection";
export const contentType = "image/png";
export const dynamic = "force-dynamic";
export const size = { height: 630, width: 1200 };

const GEIST_BOLD_URL = "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-700-normal.woff";
const GEIST_REGULAR_URL = "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-400-normal.woff";

export default async function OpenGraphImage() {
  const [geistBold, geistRegular] = await Promise.all([
    fetch(GEIST_BOLD_URL).then((res) => res.arrayBuffer()),
    fetch(GEIST_REGULAR_URL).then((res) => res.arrayBuffer()),
  ]);

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#0a1729",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Geist Sans",
        height: "100%",
        justifyContent: "center",
        position: "relative",
        width: "100%",
      }}
    >
      {/* Wave pattern — starts at top, fades out ~55% down */}
      <svg height="347" style={{ left: 0, position: "absolute", top: 0 }} viewBox="0 0 1200 347" width="1200">
        <defs>
          <linearGradient id="waveFade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(146, 176, 190, 0.14)" />
            <stop offset="70%" stopColor="rgba(146, 176, 190, 0.04)" />
            <stop offset="100%" stopColor="rgba(146, 176, 190, 0)" />
          </linearGradient>
        </defs>
        {Array.from({ length: 18 }).map((_, i) => {
          const y = i * 20;
          return (
            <path
              d={`M-70,${y + 10} C-35,${y + 2} 35,${y + 18} 70,${y + 10} C105,${y + 2} 175,${y + 18} 210,${y + 10} C245,${y + 2} 315,${y + 18} 350,${y + 10} C385,${y + 2} 455,${y + 18} 490,${y + 10} C525,${y + 2} 595,${y + 18} 630,${y + 10} C665,${y + 2} 735,${y + 18} 770,${y + 10} C805,${y + 2} 875,${y + 18} 910,${y + 10} C945,${y + 2} 1015,${y + 18} 1050,${y + 10} C1085,${y + 2} 1155,${y + 18} 1190,${y + 10} C1225,${y + 2} 1295,${y + 18} 1330,${y + 10}`}
              fill="none"
              key={y}
              stroke="url(#waveFade)"
              strokeWidth="0.8"
            />
          );
        })}
      </svg>

      {/* Anchor icon (Lucide anchor path) */}
      <div
        style={{
          alignItems: "center",
          border: "2px solid rgba(212, 184, 150, 0.5)",
          borderRadius: "50%",
          boxShadow: "0 0 60px rgba(212, 184, 150, 0.12)",
          display: "flex",
          height: 160,
          justifyContent: "center",
          position: "relative",
          width: 160,
        }}
      >
        <div
          style={{
            border: "1px solid rgba(212, 184, 150, 0.2)",
            borderRadius: "50%",
            bottom: 8,
            left: 8,
            position: "absolute",
            right: 8,
            top: 8,
          }}
        />
        <svg
          fill="none"
          height="80"
          stroke="#d4b896"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.25"
          viewBox="0 0 24 24"
          width="80"
        >
          <path d="M12 6v16" />
          <path d="m19 13 2-1a9 9 0 0 1-18 0l2 1" />
          <path d="M9 11h6" />
          <circle cx="12" cy="4" r="2" />
        </svg>
      </div>

      {/* Wordmark */}
      <div
        style={{
          color: "#d4b896",
          fontSize: 56,
          fontWeight: 700,
          letterSpacing: "0.55em",
          marginTop: 40,
        }}
      >
        ANCHR
      </div>

      {/* Tagline */}
      <div
        style={{
          color: "#fdfaf2",
          fontSize: 24,
          fontWeight: 400,
          letterSpacing: "0.15em",
          marginTop: 16,
          textTransform: "uppercase",
        }}
      >
        Your Harbor for Every Connection
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
