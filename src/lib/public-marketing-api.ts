/**
 * Unauthenticated public marketing fetches. Backend paths (assumed; align with your API):
 * - GET  /public/marketing/hubs/:marketing_slug
 * - GET  /public/marketing/releases/:release_slug
 */

function getPublicApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  if (url.startsWith("/")) {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${url.replace(/\/$/, "")}`;
    }
    const port = process.env.PORT ?? "3000";
    return `http://localhost:${port}${url.replace(/\/$/, "")}`;
  }
  return url.replace(/\/$/, "");
}

export type PublicReleaseRow = {
  ticker: string;
  name: string | null;
  rank: number | null;
  score: number | null;
  explanation: string | null;
};

export type PublicHubPastRelease = {
  slug: string;
  title: string;
  published_at: string;
  as_of: string;
};

export type PublicHubCurrentRelease = {
  id: string;
  slug?: string;
  title?: string | null;
  published_at: string;
  as_of: string;
  rows: PublicReleaseRow[];
};

export type PublicMarketingHub = {
  marketing_slug?: string;
  name: string;
  hero_image_url: string | null;
  description: string | null;
  display_formula: string | null;
  marketing_settings: Record<string, unknown> | null;
  key?: string | null;
  id?: string;
  current_release: PublicHubCurrentRelease | null;
  /** If the API provides a scheduled or estimated next drop */
  next_release_at?: string | null;
  past_releases: PublicHubPastRelease[];
  [k: string]: unknown;
};

export type PublicMarketingReleasePage = {
  title: string;
  subtitle: string | null;
  body: string | null;
  hero_image_url: string | null;
  as_of: string;
  published_at: string;
  settings_json: Record<string, unknown> | null;
  rows: PublicReleaseRow[];
  parent_formula?: {
    name: string;
    key: string;
    description: string | null;
    marketing_slug?: string | null;
  } | null;
  slug?: string;
  id?: string;
  [k: string]: unknown;
};

function unwrapPayload<T>(raw: unknown): T {
  if (raw && typeof raw === "object" && "data" in (raw as object)) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

export async function fetchPublicMarketingHub(
  marketingSlug: string
): Promise<PublicMarketingHub | null> {
  const base = getPublicApiBaseUrl();
  const res = await fetch(
    `${base}/public/marketing/hubs/${encodeURIComponent(marketingSlug)}`,
    { next: { revalidate: 60 } }
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Hub request failed (${res.status})`);
  }
  const raw: unknown = await res.json();
  return unwrapPayload<PublicMarketingHub>(raw);
}

export async function fetchPublicMarketingRelease(
  releaseSlug: string
): Promise<PublicMarketingReleasePage | null> {
  const base = getPublicApiBaseUrl();
  const res = await fetch(
    `${base}/public/marketing/releases/${encodeURIComponent(releaseSlug)}`,
    { next: { revalidate: 60 } }
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Release request failed (${res.status})`);
  }
  const raw: unknown = await res.json();
  return unwrapPayload<PublicMarketingReleasePage>(raw);
}

export function formatMarketingDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
