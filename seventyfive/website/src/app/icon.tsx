import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { height: 32, width: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#5c6b4a",
        borderRadius: 8,
        color: "#f7f5f0",
        display: "flex",
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 16,
        fontWeight: 700,
        height: "100%",
        justifyContent: "center",
        letterSpacing: "-0.06em",
        width: "100%",
      }}
    >
      75
    </div>,
    { ...size },
  );
}
