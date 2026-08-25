import type { Metadata, Viewport } from "next";
import { Fraunces, Archivo, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StatusTicker } from "@/components/layout/StatusTicker";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const description =
  "Full-Stack Engineer portfolio — React/Next.js interfaces backed by event-driven microservices architecture.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    // Applies to child-segment titles only (e.g. /resume, /work/quick-bite) — the root page
    // uses `default` above instead, since a layout's template never applies to a same-segment
    // page title. Kept short so it doesn't repeat "Full-Stack Engineer" on every sub-page.
    template: "%s — Omar Reda",
  },
  description,
  keywords: [
    "Omar Reda",
    "Full-Stack Engineer",
    "Next.js developer",
    "React developer",
    "Node.js",
    "microservices",
    "event-driven architecture",
  ],
  authors: [{ name: "Omar Reda" }],
  creator: "Omar Reda",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_NAME,
    description,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e0c0a" },
    { media: "(prefers-color-scheme: light)", color: "#f5f1e8" },
  ],
};

// Runs before hydration so the correct theme class is on <html> for the very
// first paint — no flash of the wrong theme (Phase 4 acceptance criteria).
const themeInitScript = `
  (function () {
    try {
      var stored = localStorage.getItem('theme');
      var theme =
        stored === 'light' || stored === 'dark'
          ? stored
          : window.matchMedia('(prefers-color-scheme: light)').matches
            ? 'light'
            : 'dark';
      if (theme === 'light') document.documentElement.classList.add('light');
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${archivo.variable} ${plexMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-screen flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <StatusTicker />
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
