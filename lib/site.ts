// Single source of truth for the deployed origin. Vercel sets VERCEL_PROJECT_PRODUCTION_URL
// automatically in production; the fallback below is a placeholder until the project is
// deployed (Phase 12) — swapping either just needs a redeploy, not a rearchitecture, per the
// "custom domain later without rearchitecting" locked decision (implementation-plan.md §0).
const FALLBACK_URL = "https://omar-reda-portfolio.vercel.app";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : FALLBACK_URL);

export const SITE_NAME = "Omar Reda — Full-Stack Engineer";
