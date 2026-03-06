/* eslint-disable anchr/no-inline-style */
import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = { height: 32, width: 32 };

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#0a1729",
        borderRadius: "50%",
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
          border: "1px solid rgba(212, 184, 150, 0.5)",
          borderRadius: "50%",
          display: "flex",
          height: 30,
          justifyContent: "center",
          position: "relative",
          width: 30,
        }}
      >
        {/* Inner ring */}
        <div
          style={{
            border: "1px solid rgba(212, 184, 150, 0.2)",
            borderRadius: "50%",
            bottom: 2,
            left: 2,
            position: "absolute",
            right: 2,
            top: 2,
          }}
        />
        {/* Anchor icon */}
        <svg
          fill="none"
          height="16"
          stroke="#d4b896"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="16"
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
