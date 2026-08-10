import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = { height: 180, width: 180 };

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#5c6b4a",
        borderRadius: 40,
        color: "#f7f5f0",
        display: "flex",
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 96,
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
