import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Replaces the stock create-next-app favicon.ico with the same "OR" monogram used as the
// Header logo — typographic identity only, no photo (Design Direction, CLAUDE.md).
export default function Icon() {
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
          fontSize: 18,
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
