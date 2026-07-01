"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_DASHBOARD, ORG_DASHBOARD } from "@/lib/auth-routing";
import type { DashboardBasePath } from "@/lib/auth-routing";
import { RunModal } from "./run-modal";
import {
  INVESTOR_SCORE_SUB_NAV,
  MONETIZATION_SUB_NAV,
  SOCIAL_SUB_NAV,
  isNavItemActive,
} from "./nav-config";
import { GhostButton, PrimaryButton } from "@/components/ui-kit/buttons";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const NAV_SEGMENTS = [
  { segment: "/screener", label: "Screener" },
  { segment: "/stocks", label: "Stock details" },
  { segment: "/multi-formula-screener", label: "Multi formula screener" },
  { segment: "/watchlists", label: "Watchlists" },
  { segment: "/assistant", label: "AI assistant" },
  { segment: "/event-sentiment", label: "Event sentiment" },
  { segment: "/jobs-formulas", label: "Jobs formulas" },
  { segment: "/clients", label: "Clients" },
  { segment: "/team", label: "Team" },
  {
    segment: "/fundamental-constriction",
    label: "Fundamental constriction",
  },
  { segment: "/political-score", label: "Political score" },
  { segment: "/investors-scores", label: "Investors scores" },
  { segment: "/insider-conviction", label: "Insider conviction" },
  { segment: "/net-exposure", label: "Net exposure" },
  { segment: "/structural-growth", label: "Structural growth" },
  { segment: "/funds", label: "Funds" },
  { segment: "/files", label: "Files" },
  { segment: "/formulas", label: "Formulas" },
  { segment: "/signal-categories", label: "Formula categories" },
  { segment: "/configuration", label: "Configuration" },
  { segment: "/job-posts", label: "Job posts" },
  { segment: "/job-counts", label: "Job counts" },
  { segment: "/employee-headcount", label: "Employee headcount" },
  { segment: "/ingest-filters", label: "Ingest filters" },
  { segment: "/content-categories", label: "Content categories" },
  { segment: "/exposures-tags", label: "Exposures & tags" },
] as const;
import { BrandLogo } from "@/components/brand-logo";
import {
  Bookmark,
  Briefcase,
  Calculator,
  CreditCard,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cog,
  FileText,
  FlaskConical,
  LayoutGrid,
  LineChart,
  Search,
  Share2,
  Shield,
  Sparkles,
  Tags,
  Users,
} from "lucide-react";

const ORG_HOME_NAV_SEGMENTS = [
  "/clients",
  "/screener",
  "/stocks",
  "/multi-formula-screener",
  "/watchlists",
  "/assistant",
  "/event-sentiment",
  "/jobs-formulas",
  "/team",
  "/formulas",
  "/fundamental-constriction",
  "/political-score",
  "/investors-scores",
  "/insider-conviction",
  "/net-exposure",
  "/structural-growth",
] as const;
const NAV_ICONS = {
  "/screener": Search,
  "/stocks": Search,
  "/multi-formula-screener": LineChart,
  "/watchlists": Bookmark,
  "/assistant": Sparkles,
  "/clients": Briefcase,
  "/team": Users,
  "/fundamental-constriction": FlaskConical,
  "/political-score": Shield,
  "/investors-scores": LineChart,
  "/insider-conviction": Calculator,
  "/net-exposure": LineChart,
  "/structural-growth": LineChart,
  "/formulas": LayoutGrid,
  "/funds": Briefcase,
  "/configuration": Cog,
  "/signal-categories": Tags,
} as const;

export function Sidebar({
  basePath,
  collapsed,
  onToggleCollapsed,
}: {
  basePath: DashboardBasePath;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const [showRunModal, setShowRunModal] = useState(false);

  const orgClientsPath = `${ORG_DASHBOARD}/clients`;
  const orgFcPath = `${ORG_DASHBOARD}/fundamental-constriction`;
  const orgPsPath = `${ORG_DASHBOARD}/political-score`;
  const orgIcPath = `${ORG_DASHBOARD}/insider-conviction`;
  const orgInvestorsScoresPath = `${ORG_DASHBOARD}/investors-scores`;
  const orgNePath = `${ORG_DASHBOARD}/net-exposure`;
  const orgStructuralPath = `${ORG_DASHBOARD}/structural-growth`;
  const orgScreenerPath = `${ORG_DASHBOARD}/screener`;
  const orgStocksPath = `${ORG_DASHBOARD}/stocks`;
  const orgMultiFormulaScreenerPath = `${ORG_DASHBOARD}/multi-formula-screener`;
  const orgWatchlistsPath = `${ORG_DASHBOARD}/watchlists`;
  const orgAssistantPath = `${ORG_DASHBOARD}/assistant`;
  const orgEventSentimentPath = `${ORG_DASHBOARD}/event-sentiment`;
  const orgJobsFormulasPath = `${ORG_DASHBOARD}/jobs-formulas`;
  const orgFormulasPath = `${ORG_DASHBOARD}/formulas`;
  const isOrgFormulasPage =
    basePath === ORG_DASHBOARD &&
    (pathname === orgFormulasPath || pathname.startsWith(`${orgFormulasPath}/`));
  const isOrgDashboardRoot = basePath === ORG_DASHBOARD && pathname === ORG_DASHBOARD;
  const isOrgClientsPage =
    basePath === ORG_DASHBOARD &&
    (pathname === orgClientsPath || pathname.startsWith(`${orgClientsPath}/`));
  const isOrgFundamentalPage =
    basePath === ORG_DASHBOARD &&
    (pathname === orgFcPath || pathname.startsWith(`${orgFcPath}/`));
  const isOrgPoliticalPage =
    basePath === ORG_DASHBOARD &&
    (pathname === orgPsPath || pathname.startsWith(`${orgPsPath}/`));
  const isOrgInsiderConvictionPage =
    basePath === ORG_DASHBOARD &&
    (pathname === orgIcPath || pathname.startsWith(`${orgIcPath}/`));
  const isOrgInvestorsScoresPage =
    basePath === ORG_DASHBOARD &&
    (pathname === orgInvestorsScoresPath || pathname.startsWith(`${orgInvestorsScoresPath}/`));
  const isOrgNetExposurePage =
    basePath === ORG_DASHBOARD &&
    (pathname === orgNePath || pathname.startsWith(`${orgNePath}/`));
  const isOrgStructuralGrowthPage =
    basePath === ORG_DASHBOARD &&
    (pathname === orgStructuralPath ||
      pathname.startsWith(`${orgStructuralPath}/`));
  const isOrgScreenerPage =
    basePath === ORG_DASHBOARD &&
    (pathname === orgScreenerPath || pathname.startsWith(`${orgScreenerPath}/`));
  const isOrgStocksPage =
    basePath === ORG_DASHBOARD &&
    (pathname === orgStocksPath || pathname.startsWith(`${orgStocksPath}/`));
  const isOrgMultiFormulaScreenerPage =
    basePath === ORG_DASHBOARD &&
    (pathname === orgMultiFormulaScreenerPath ||
      pathname.startsWith(`${orgMultiFormulaScreenerPath}/`));
  const isOrgWatchlistsPage =
    basePath === ORG_DASHBOARD &&
    (pathname === orgWatchlistsPath || pathname.startsWith(`${orgWatchlistsPath}/`));
  const isOrgAssistantPage =
    basePath === ORG_DASHBOARD &&
    (pathname === orgAssistantPath || pathname.startsWith(`${orgAssistantPath}/`));
  const isOrgEventSentimentPage =
    basePath === ORG_DASHBOARD &&
    (pathname === orgEventSentimentPath ||
      pathname.startsWith(`${orgEventSentimentPath}/`));
  const isOrgJobsFormulasPage =
    basePath === ORG_DASHBOARD &&
    (pathname === orgJobsFormulasPath || pathname.startsWith(`${orgJobsFormulasPath}/`));

  const navSegments = (
    isOrgDashboardRoot ||
    isOrgClientsPage ||
    isOrgScreenerPage ||
    isOrgStocksPage ||
    isOrgMultiFormulaScreenerPage ||
    isOrgWatchlistsPage ||
    isOrgAssistantPage ||
    isOrgEventSentimentPage ||
    isOrgJobsFormulasPage ||
    isOrgFormulasPage ||
    isOrgFundamentalPage ||
    isOrgPoliticalPage ||
    isOrgInvestorsScoresPage ||
    isOrgInsiderConvictionPage ||
    isOrgNetExposurePage ||
    isOrgStructuralGrowthPage
      ? NAV_SEGMENTS.filter((item) =>
          (ORG_HOME_NAV_SEGMENTS as readonly string[]).includes(item.segment),
        )
      : basePath === ORG_DASHBOARD
        ? NAV_SEGMENTS
        : NAV_SEGMENTS.filter((item) => item.segment !== "/clients")
  ).filter(
    (item) =>
      (basePath === ORG_DASHBOARD || item.segment !== "/team") &&
      (basePath !== ADMIN_DASHBOARD ||
        ![
          "/multi-formula-screener",
          "/watchlists",
          "/event-sentiment",
          "/jobs-formulas",
        ].includes(item.segment)) &&
      (basePath === ADMIN_DASHBOARD || item.segment !== "/job-posts") &&
      (basePath === ADMIN_DASHBOARD || item.segment !== "/job-counts") &&
      (basePath === ADMIN_DASHBOARD || item.segment !== "/employee-headcount") &&
      (basePath === ADMIN_DASHBOARD || item.segment !== "/ingest-filters") &&
      (basePath === ADMIN_DASHBOARD || item.segment !== "/content-categories") &&
      (basePath === ADMIN_DASHBOARD || item.segment !== "/exposures-tags") &&
      (basePath === ADMIN_DASHBOARD || item.segment !== "/configuration") &&
      (basePath === ADMIN_DASHBOARD || item.segment !== "/signal-categories") &&
      (basePath === ORG_DASHBOARD || item.segment !== "/assistant")
  );
  const [investorsSubOpen, setInvestorsSubOpen] = useState(true);
  const [socialSubOpen, setSocialSubOpen] = useState(true);
  const [monetizationSubOpen, setMonetizationSubOpen] = useState(true);
  const investorsHub = `${basePath}/investors-scores`;
  const socialHub = `${ADMIN_DASHBOARD}/social`;
  const monetizationHub = `${ADMIN_DASHBOARD}/monetization`;
  const isInvestorModelPath =
    pathname.startsWith(`${investorsHub}/`) && pathname !== investorsHub;
  const isSocialPath = pathname.startsWith(`${ADMIN_DASHBOARD}/social`);
  const isMonetizationPath = pathname.startsWith(`${ADMIN_DASHBOARD}/monetization`);

  useEffect(() => {
    if (isInvestorModelPath) {
      setInvestorsSubOpen(true);
    }
  }, [isInvestorModelPath]);

  useEffect(() => {
    if (isSocialPath) {
      setSocialSubOpen(true);
    }
  }, [isSocialPath]);

  useEffect(() => {
    if (isMonetizationPath) {
      setMonetizationSubOpen(true);
    }
  }, [isMonetizationPath]);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-2" : "justify-between px-6"
        )}
      >
        <Link
          href={basePath}
          className={cn(
            "inline-flex items-center"
          )}
        >
          <BrandLogo collapsed={collapsed} />
        </Link>
        <GhostButton
          type="button"
          size="icon-sm"
          className={cn("text-muted-foreground", collapsed && "absolute right-2 top-5")}
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </GhostButton>
      </div>
      <nav
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto",
          collapsed ? "p-2" : "p-4"
        )}
      >
        <PrimaryButton
          type="button"
          className={cn("justify-center shadow-sm", collapsed ? "h-10 w-10 self-center p-0" : "w-full")}
          onClick={() => setShowRunModal(true)}
          aria-label="Run"
          title={collapsed ? "Run" : undefined}
        >
          {collapsed ? "R" : "Run"}
        </PrimaryButton>
        <Separator className="my-1 bg-sidebar-border" />
        {navSegments.map((item) => {
          if (item.segment === "/investors-scores") {
            const href = `${basePath}${item.segment}`;
            const isActive = isNavItemActive(pathname, basePath, item.segment);
            const Icon = NAV_ICONS["/investors-scores"] ?? FileText;
            return (
              <div key={item.segment} className="flex flex-col gap-0.5">
                <div
                  className={cn(
                    "flex w-full min-w-0 items-stretch",
                    collapsed ? "justify-center" : "gap-0.5"
                  )}
                >
                  <GhostButton
                    className={cn(
                      "h-10 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                      collapsed
                        ? "w-10 shrink-0 justify-center px-0"
                        : "min-w-0 flex-1 justify-start px-3",
                      isActive &&
                        "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                    )}
                    asChild
                  >
                    <Link
                      href={href}
                      aria-label={item.label}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={cn("size-4 shrink-0", !collapsed && "mr-2")} aria-hidden />
                      {!collapsed ? item.label : null}
                    </Link>
                  </GhostButton>
                  {!collapsed && (
                    <button
                      type="button"
                      onClick={() => setInvestorsSubOpen((o) => !o)}
                      className="inline-flex h-10 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-expanded={investorsSubOpen}
                      aria-label={
                        investorsSubOpen ? "Hide formula pages" : "Show formula pages"
                      }
                    >
                      <ChevronDown
                        className={cn(
                          "size-4 transition-transform",
                          investorsSubOpen && "rotate-180"
                        )}
                        aria-hidden
                      />
                    </button>
                  )}
                </div>
                {!collapsed && investorsSubOpen && (
                  <ul className="ml-1 space-y-0.5 border-l border-sidebar-border pl-2" role="list">
                    {INVESTOR_SCORE_SUB_NAV.map((sub) => {
                      const subHref = `${basePath}${sub.segment}`;
                      const subActive = isNavItemActive(
                        pathname,
                        basePath,
                        sub.segment
                      );
                      return (
                        <li key={sub.segment}>
                          <Link
                            href={subHref}
                            className={cn(
                              "flex h-9 items-center rounded-lg px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                              subActive &&
                                "bg-primary/10 font-medium text-primary hover:bg-primary/15 hover:text-primary"
                            )}
                          >
                            {sub.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          }
          const href = `${basePath}${item.segment}`;
          const isActive = isNavItemActive(pathname, basePath, item.segment);
          const Icon = NAV_ICONS[item.segment as keyof typeof NAV_ICONS] ?? FileText;
          return (
            <GhostButton
              key={item.segment}
              className={cn(
                "h-10 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed ? "w-10 self-center justify-center px-0" : "w-full justify-start px-3",
                isActive &&
                  "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
              )}
              asChild
            >
              <Link href={href} aria-label={item.label} title={collapsed ? item.label : undefined}>
                <Icon className={cn("size-4 shrink-0", !collapsed && "mr-2")} aria-hidden />
                {!collapsed ? item.label : null}
              </Link>
            </GhostButton>
          );
        })}
        {basePath === ADMIN_DASHBOARD && (
          <div className="flex flex-col gap-0.5">
            <div
              className={cn(
                "flex w-full min-w-0 items-stretch",
                collapsed ? "justify-center" : "gap-0.5"
              )}
            >
              <GhostButton
                className={cn(
                  "h-10 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed
                    ? "w-10 shrink-0 justify-center px-0"
                    : "min-w-0 flex-1 justify-start px-3",
                  isSocialPath &&
                    "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                )}
                asChild
              >
                <Link
                  href={socialHub}
                  aria-label="Social media"
                  title={collapsed ? "Social media" : undefined}
                >
                  <Share2 className={cn("size-4 shrink-0", !collapsed && "mr-2")} aria-hidden />
                  {!collapsed ? "Social media" : null}
                </Link>
              </GhostButton>
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => setSocialSubOpen((o) => !o)}
                  className="inline-flex h-10 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-expanded={socialSubOpen}
                  aria-label={socialSubOpen ? "Hide social media pages" : "Show social media pages"}
                >
                  <ChevronDown
                    className={cn("size-4 transition-transform", socialSubOpen && "rotate-180")}
                    aria-hidden
                  />
                </button>
              )}
            </div>
            {!collapsed && socialSubOpen && (
              <ul className="ml-1 space-y-0.5 border-l border-sidebar-border pl-2" role="list">
                {SOCIAL_SUB_NAV.map((sub) => {
                  const subHref = `${ADMIN_DASHBOARD}${sub.segment}`;
                  const subActive = isNavItemActive(pathname, ADMIN_DASHBOARD, sub.segment);
                  return (
                    <li key={sub.segment}>
                      <Link
                        href={subHref}
                        className={cn(
                          "flex h-9 items-center rounded-lg px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                          subActive &&
                            "bg-primary/10 font-medium text-primary hover:bg-primary/15 hover:text-primary"
                        )}
                      >
                        {sub.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
        {basePath === ADMIN_DASHBOARD && (
          <div className="flex flex-col gap-0.5">
            <div
              className={cn(
                "flex w-full min-w-0 items-stretch",
                collapsed ? "justify-center" : "gap-0.5"
              )}
            >
              <GhostButton
                className={cn(
                  "h-10 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed
                    ? "w-10 shrink-0 justify-center px-0"
                    : "min-w-0 flex-1 justify-start px-3",
                  isMonetizationPath &&
                    "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                )}
                asChild
              >
                <Link
                  href={monetizationHub}
                  aria-label="AI Monetization"
                  title={collapsed ? "AI Monetization" : undefined}
                >
                  <CreditCard className={cn("size-4 shrink-0", !collapsed && "mr-2")} aria-hidden />
                  {!collapsed ? "AI Monetization" : null}
                </Link>
              </GhostButton>
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => setMonetizationSubOpen((o) => !o)}
                  className="inline-flex h-10 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-expanded={monetizationSubOpen}
                  aria-label={
                    monetizationSubOpen ? "Hide monetization pages" : "Show monetization pages"
                  }
                >
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      monetizationSubOpen && "rotate-180"
                    )}
                    aria-hidden
                  />
                </button>
              )}
            </div>
            {!collapsed && monetizationSubOpen && (
              <ul className="ml-1 space-y-0.5 border-l border-sidebar-border pl-2" role="list">
                {MONETIZATION_SUB_NAV.map((sub) => {
                  const subHref = `${ADMIN_DASHBOARD}${sub.segment}`;
                  const subActive = isNavItemActive(pathname, ADMIN_DASHBOARD, sub.segment);
                  return (
                    <li key={sub.segment}>
                      <Link
                        href={subHref}
                        className={cn(
                          "flex h-9 items-center rounded-lg px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                          subActive &&
                            "bg-primary/10 font-medium text-primary hover:bg-primary/15 hover:text-primary"
                        )}
                      >
                        {sub.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </nav>
      <RunModal
        basePath={basePath}
        isOpen={showRunModal}
        onClose={() => setShowRunModal(false)}
      />
    </aside>
  );
}
