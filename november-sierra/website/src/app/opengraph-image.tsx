import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "November Sierra — Thoughtful. Intentional. Software.";
export const size = { height: 630, width: 1200 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 50%, #1a2e1a 100%)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          background: "#e8ede5",
          height: 1,
          marginBottom: 24,
          width: 400,
        }}
      />

      {/* Wordmark */}
      <div
        style={{
          color: "#e8ede5",
          display: "flex",
          fontFamily: "serif",
          fontSize: 72,
          letterSpacing: "0.15em",
        }}
      >
        NOVEMBER SIERRA
      </div>

      {/* Bottom bar */}
      <div
        style={{
          background: "#e8ede5",
          height: 1,
          marginTop: 24,
          width: 400,
        }}
      />

      {/* Tagline */}
      <div
        style={{
          color: "#c8cec3",
          display: "flex",
          fontFamily: "serif",
          fontSize: 24,
          fontStyle: "italic",
          letterSpacing: "0.05em",
          marginTop: 40,
        }}
      >
        Thoughtful. Intentional. Software.
      </div>
    </div>,
    {
      ...size,
    },
  );
}
