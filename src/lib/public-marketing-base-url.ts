/**
 * Canonical marketing / public site origin, for links built on the app host (e.g. app.localhost
 * or app.*.vercel.app) that must open the public marketing host (localhost, www, etc.).
 * Set NEXT_PUBLIC_MARKETING_BASE_URL to match MARKETING_CANONICAL_URL (no trailing slash).
 */
export function getPublicMarketingBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_MARKETING_BASE_URL?.replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return "https://www.withprecision.ai";
}

export function absolutePublicMarketingUrl(path: string): string {
  const base = getPublicMarketingBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
