/**
 * Public marketing URLs use `/formula/...` on the **marketing** host. Middleware rewrites them to
 * the App Router at `src/app/m/formula/...`. Do not use the app subdomain for these; use
 * `absolutePublicMarketingUrl(marketingReleasePath(...))` when opening from the app.
 *
 * - Live: `marketingHubPath` / `marketingReleasePath` (path only, start with /formula/…).
 * - Fixtures (no API): {@link M_FORMULA_PREVIEW_HUB}, {@link M_FORMULA_PREVIEW_RELEASE} stay under /m/…/preview/…
 */
export const M_FORMULA_HUB_BASE = "/formula/hub";
export const M_FORMULA_RELEASE_BASE = "/formula/release";

export const M_FORMULA_PREVIEW_HUB = "/m/formula/preview/hub";
export const M_FORMULA_PREVIEW_RELEASE = "/m/formula/preview/release";

export function marketingHubPath(marketingSlug: string) {
  return `${M_FORMULA_HUB_BASE}/${encodeURIComponent(marketingSlug)}`;
}

export function marketingReleasePath(releaseSlug: string) {
  return `${M_FORMULA_RELEASE_BASE}/${encodeURIComponent(releaseSlug)}`;
}
