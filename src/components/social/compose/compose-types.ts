export const RENDER_TEMPLATE_STORAGE_KEY = "precision_social_render_template";

export const POST_KINDS = ["link_share", "single_image", "text", "video"] as const;
export type PostKind = (typeof POST_KINDS)[number];

export type SignalContext = {
  ticker: string;
  signal_name: string;
  summary: string;
  page_url: string;
  organization_name: string;
};

export const DEFAULT_SIGNAL_CONTEXT: SignalContext = {
  organization_name: "Precision",
  ticker: "AAPL",
  signal_name: "High insider precision",
  summary:
    "Insider buying accelerated over the last 90 days with clustered open-market purchases.",
  page_url: "https://app.withprecision.ai/stocks/AAPL",
};

export const PLATFORM_CHAR_LIMITS: Record<string, number> = {
  x: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
  tiktok: 2200,
  stocktwits: 1000,
};

export function parseTickerFromUrl(url: string): string | null {
  const match = url.match(/\/stocks\/([A-Za-z0-9._-]+)/i);
  return match?.[1]?.toUpperCase() ?? null;
}

export function localDatetimeToUtcIso(localValue: string): string {
  const d = new Date(localValue);
  return d.toISOString();
}

export function suggestPostKindFromMedia(
  mediaTypes: string[],
  current: PostKind
): PostKind {
  if (!mediaTypes.length) return current === "single_image" || current === "video" ? "link_share" : current;
  const hasVideo = mediaTypes.some((t) => /video/i.test(t));
  if (hasVideo) return "video";
  return "single_image";
}
