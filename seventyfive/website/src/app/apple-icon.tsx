 
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
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <svg fill="none" height="180" viewBox="0 0 32 32" width="180">
        <g stroke="#f7f5f0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.35">
          <path d="M6.8 9.2h8.4L11.6 23.2" />
          <path d="M25.2 9.2h-7.6v5.1c.9-.55 2.05-.85 3.35-.85 3.05 0 5.15 1.85 5.15 4.55 0 2.85-2.25 4.7-5.35 4.7-2.2 0-3.9-.85-4.75-2.25" />
        </g>
      </svg>
    </div>,
    { ...size },
  );
}
