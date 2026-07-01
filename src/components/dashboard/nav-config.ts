import { ADMIN_DASHBOARD, ORG_DASHBOARD } from "@/lib/auth-routing";
import type { DashboardBasePath } from "@/lib/auth-routing";

export type DashboardNavItem = {
  segment: string;
  label: string;
};

const NAV_SEGMENTS: readonly DashboardNavItem[] = [
  { segment: "/screener", label: "Screener" },
  { segment: "/stocks", label: "Stock details" },
  { segment: "/multi-formula-screener", label: "Multi formula screener" },
  { segment: "/watchlists", label: "Watchlists" },
  { segment: "/assistant", label: "AI assistant" },
  { segment: "/clients", label: "Clients" },
  { segment: "/team", label: "Team" },
  { segment: "/formulas", label: "Formulas" },
  { segment: "/signal-categories", label: "Formula categories" },
  {
    segment: "/fundamental-constriction",
    label: "Fundamental constriction",
  },
  { segment: "/political-score", label: "Political score" },
  { segment: "/investors-scores", label: "Investors scores" },
  { segment: "/insider-precision", label: "Insider precision" },
  { segment: "/net-exposure", label: "Net exposure" },
  { segment: "/structural-growth", label: "Structural growth" },
  { segment: "/funds", label: "Funds" },
  { segment: "/configuration", label: "Configuration" },
];

/** Sub-routes under `/monetization` — platform admin only. */
export const MONETIZATION_SUB_NAV: readonly DashboardNavItem[] = [
  { segment: "/monetization", label: "Overview" },
  { segment: "/monetization/plans", label: "Plans" },
  { segment: "/monetization/entitlements", label: "Entitlements matrix" },
  { segment: "/monetization/organizations", label: "Organizations" },
  { segment: "/monetization/stripe-events", label: "Stripe events" },
  { segment: "/monetization/preview", label: "Preview" },
];

/** Sub-routes under `/social` */
export const SOCIAL_SUB_NAV: readonly DashboardNavItem[] = [
  { segment: "/social", label: "Overview" },
  { segment: "/social/accounts", label: "Connected accounts" },
  { segment: "/social/prompts", label: "Prompt library" },
  { segment: "/social/compose", label: "Compose" },
  { segment: "/social/posts", label: "Post history" },
  { segment: "/social/media", label: "Media" },
  { segment: "/social/webhooks", label: "Webhooks" },
];

/** Sub-routes under `/investors-scores` — rendered behind a toggle in the sidebar, not as top-level items. */
export const INVESTOR_SCORE_SUB_NAV: readonly DashboardNavItem[] = [
  { segment: "/investors-scores/buffett", label: "Buffett" },
  { segment: "/investors-scores/burry", label: "Burry" },
  { segment: "/investors-scores/druckenmiller", label: "Druckenmiller" },
  { segment: "/investors-scores/wood", label: "Wood" },
  { segment: "/investors-scores/graham", label: "Graham" },
  { segment: "/investors-scores/lynch", label: "Lynch" },
];

export const adminNavItems: readonly DashboardNavItem[] = NAV_SEGMENTS.filter(
  (item) =>
    item.segment !== "/clients" &&
    item.segment !== "/team" &&
    item.segment !== "/assistant"
);

export const organizationNavItems: readonly DashboardNavItem[] = NAV_SEGMENTS.filter(
  (item) => item.segment !== "/configuration" && item.segment !== "/signal-categories"
);

export const organizationHomeNavItems: readonly DashboardNavItem[] = [
  "/clients",
  "/screener",
  "/stocks",
  "/multi-formula-screener",
  "/watchlists",
  "/assistant",
  "/team",
  "/formulas",
  "/fundamental-constriction",
  "/political-score",
  "/investors-scores",
  "/insider-precision",
  "/net-exposure",
  "/structural-growth",
]
  .map((segment) => organizationNavItems.find((item) => item.segment === segment))
  .filter((item): item is DashboardNavItem => Boolean(item));

function isMatchingPath(pathname: string, targetPath: string): boolean {
  return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
}

function isOrganizationHomeContext(pathname: string): boolean {
  if (pathname === ORG_DASHBOARD) return true;

  const orgHomePaths = [
    `${ORG_DASHBOARD}/clients`,
    `${ORG_DASHBOARD}/screener`,
    `${ORG_DASHBOARD}/stocks`,
    `${ORG_DASHBOARD}/multi-formula-screener`,
    `${ORG_DASHBOARD}/watchlists`,
    `${ORG_DASHBOARD}/assistant`,
    `${ORG_DASHBOARD}/formulas`,
    `${ORG_DASHBOARD}/fundamental-constriction`,
    `${ORG_DASHBOARD}/political-score`,
    `${ORG_DASHBOARD}/insider-precision`,
    `${ORG_DASHBOARD}/net-exposure`,
    `${ORG_DASHBOARD}/structural-growth`,
  ];

  if (pathname === `${ORG_DASHBOARD}/investors-scores`) return true;
  if (pathname.startsWith(`${ORG_DASHBOARD}/investors-scores/`)) return true;

  return orgHomePaths.some((path) => isMatchingPath(pathname, path));
}

export function resolveSidebarItems(
  basePath: DashboardBasePath,
  pathname: string
): readonly DashboardNavItem[] {
  if (basePath === ADMIN_DASHBOARD) return adminNavItems;

  if (basePath === ORG_DASHBOARD && isOrganizationHomeContext(pathname)) {
    return organizationHomeNavItems;
  }

  if (basePath === ORG_DASHBOARD) {
    return organizationNavItems;
  }

  return [];
}

export function isNavItemActive(
  pathname: string,
  basePath: DashboardBasePath,
  segment: string
) {
  if (segment === "/investors-scores") {
    return pathname === `${basePath}/investors-scores`;
  }
  if (segment === "/monetization") {
    return pathname === `${basePath}/monetization`;
  }
  if (segment === "/monetization/plans") {
    return isMatchingPath(pathname, `${basePath}/monetization/plans`);
  }
  if (segment === "/monetization/entitlements") {
    return isMatchingPath(pathname, `${basePath}/monetization/entitlements`);
  }
  if (segment === "/monetization/organizations") {
    return isMatchingPath(pathname, `${basePath}/monetization/organizations`);
  }
  if (segment === "/monetization/stripe-events") {
    return isMatchingPath(pathname, `${basePath}/monetization/stripe-events`);
  }
  if (segment === "/monetization/preview") {
    return isMatchingPath(pathname, `${basePath}/monetization/preview`);
  }
  if (segment === "/social") {
    return pathname === `${basePath}/social`;
  }
  if (segment === "/social/accounts") {
    return isMatchingPath(pathname, `${basePath}/social/accounts`);
  }
  if (segment === "/social/posts") {
    return isMatchingPath(pathname, `${basePath}/social/posts`);
  }
  return isMatchingPath(pathname, `${basePath}${segment}`);
}
