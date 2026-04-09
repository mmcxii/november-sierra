import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { height: 180, width: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#1a2e1a",
        borderRadius: 36,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div style={{ background: "#e8ede5", height: 2, width: 120 }} />
      <div
        style={{
          color: "#e8ede5",
          display: "flex",
          fontFamily: "serif",
          fontSize: 80,
          fontWeight: 700,
          letterSpacing: "0.05em",
          lineHeight: 1,
          marginBottom: 10,
          marginTop: 10,
        }}
      >
        NS
      </div>
      <div style={{ background: "#e8ede5", height: 2, width: 120 }} />
    </div>,
    { ...size },
  );
}
