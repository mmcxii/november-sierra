import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { height: 32, width: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#1a2e1a",
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div style={{ background: "#e8ede5", height: 1, width: 22 }} />
      <div
        style={{
          color: "#e8ede5",
          display: "flex",
          fontFamily: "serif",
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "0.05em",
          lineHeight: 1,
          marginBottom: 2,
          marginTop: 2,
        }}
      >
        NS
      </div>
      <div style={{ background: "#e8ede5", height: 1, width: 22 }} />
    </div>,
    { ...size },
  );
}
