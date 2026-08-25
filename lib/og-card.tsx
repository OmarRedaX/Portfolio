import { hero } from "@/content";

// Shared visual for app/opengraph-image.tsx and app/twitter-image.tsx — kept out of the app/
// segment so Next.js doesn't treat it as a third image route.
export function OgCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 28,
        padding: "80px 96px",
        background: "#0e0c0a",
        backgroundImage:
          "linear-gradient(#6fa8c7 1px, transparent 1px), linear-gradient(90deg, #6fa8c7 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: 26,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "#6fa8c7",
          fontWeight: 600,
        }}
      >
        {"[ "}
        {hero.title}
        {" ]"}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 108,
          fontWeight: 700,
          color: "#f2ede4",
          lineHeight: 1.05,
        }}
      >
        {hero.name}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 32,
          color: "#a99e8d",
          maxWidth: 900,
        }}
      >
        {hero.tagline}
      </div>
    </div>
  );
}
