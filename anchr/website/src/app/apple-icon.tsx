/* eslint-disable anchr/no-inline-style */
import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = { height: 180, width: 180 };

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#0a1729",
        borderRadius: 40,
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      {/* Outer ring */}
      <div
        style={{
          alignItems: "center",
          border: "2px solid rgba(212, 184, 150, 0.5)",
          borderRadius: "50%",
          boxShadow: "0 0 40px rgba(212, 184, 150, 0.1)",
          display: "flex",
          height: 140,
          justifyContent: "center",
          position: "relative",
          width: 140,
        }}
      >
        {/* Inner ring */}
        <div
          style={{
            border: "1px solid rgba(212, 184, 150, 0.2)",
            borderRadius: "50%",
            bottom: 6,
            left: 6,
            position: "absolute",
            right: 6,
            top: 6,
          }}
        />
        {/* Anchor icon */}
        <svg
          fill="none"
          height="70"
          stroke="#d4b896"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          width="70"
        >
          <path d="M12 6v16" />
          <path d="m19 13 2-1a9 9 0 0 1-18 0l2 1" />
          <path d="M9 11h6" />
          <circle cx="12" cy="4" r="2" />
        </svg>
      </div>
    </div>,
    { ...size },
  );
}
