import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS home-screen icon — same monogram as icon.tsx, sized per Apple's touch-icon convention.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0e0c0a",
          color: "#f2ede4",
          fontSize: 84,
          fontWeight: 600,
          fontFamily: "Georgia, serif",
        }}
      >
        OR
      </div>
    ),
    { ...size },
  );
}
