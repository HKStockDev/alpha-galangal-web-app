"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { ADMIN_DASHBOARD, ORG_DASHBOARD } from "@/lib/auth-routing";
import {
  addOrganizationWatchlistSecurity,
  fetchMyOrganizations,
  getOrganizationEquityDetails,
  getSecurityFmpNewsCached,
  ingestSecurityFmpNewsFromFmp,
  getStockChart,
  ingestStockChartBarsFromFmp,
  listOrganizationClients,
  listOrganizationWatchlists,
  PLATFORM_ADMIN_ORG_ROUTE_PLACEHOLDER,
  type MyOrganization,
  type OrganizationClient,
  type OrganizationWatchlist,
  type FmpStockNewsBundle,
  type OrgEquityDetails,
  type StockChartData,
  type StockChartPoint,
  type StockChartRange,
} from "@/lib/api";
import { FormulaShareSection } from "@/components/marketing/formula/formula-share-section";
import { AdminSocialPublishSection } from "@/components/social/admin-social-publish-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { StockPriceChart } from "@/components/charts/stock/stock-price-chart";

function formatNumber(v: number | null): string {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toLocaleString();
}

function formatScore(v: number | null): string {
  if (v == null || Number.isNaN(v)) return "—";
  return String(Math.round(v * 1000) / 1000);
}

function formatMarketCap(v: number | null): string {
  if (v == null || Number.isNaN(v)) return "—";
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  return v.toLocaleString();
}

function formatExposurePolarity(p: number | null): string {
  if (p === 1) return "+1";
  if (p === -1) return "−1";
  if (p === 0) return "0";
  return "—";
}

function formatFmpNewsDate(raw: string | null): string {
  if (!raw?.trim()) return "—";
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return raw.trim();
}

const CHART_RANGES: StockChartRange[] = ["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "MAX"];

/** Collapsed FMP news card: same count each column for a balanced grid. */
const FMP_NEWS_PREVIEW_EACH = 3;

type WatchlistAddScope = "global" | "client";

const selectTriggerClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

function priceChange(points: StockChartPoint[]): { diff: number; pct: number } | null {
  if (points.length < 2) return null;
  const first = points[0].close;
  const last = points[points.length - 1].close;
  return { diff: last - first, pct: ((last - first) / first) * 100 };
}

export default function StockDetailsPage() {
  const params = useParams<{ securityId: string }>();
  const securityId = params?.securityId;
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<OrgEquityDetails | null>(null);

  const [chartRange, setChartRange] = useState<StockChartRange>("1D");
  const [chartData, setChartData] = useState<StockChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartIngestLoading, setChartIngestLoading] = useState(false);

  const [myOrgs, setMyOrgs] = useState<MyOrganization[]>([]);
  const [watchlistOrgId, setWatchlistOrgId] = useState("");
  const [watchlistClients, setWatchlistClients] = useState<OrganizationClient[]>([]);
  const [watchlistScope, setWatchlistScope] = useState<WatchlistAddScope>("global");
  const [watchlistClientId, setWatchlistClientId] = useState("");
  const [watchlistsForAdd, setWatchlistsForAdd] = useState<OrganizationWatchlist[]>([]);
  const [selectedWatchlistIdForAdd, setSelectedWatchlistIdForAdd] = useState("");
  const [watchlistsMetaLoading, setWatchlistsMetaLoading] = useState(false);
  const [watchlistAddSubmitting, setWatchlistAddSubmitting] = useState(false);

  const [fmpNews, setFmpNews] = useState<FmpStockNewsBundle | null>(null);
  const [fmpNewsLoading, setFmpNewsLoading] = useState(false);
  const [fmpNewsIngestLoading, setFmpNewsIngestLoading] = useState(false);
  const [fmpNewsExpanded, setFmpNewsExpanded] = useState(false);

  useEffect(() => {
    if (!accessToken || !securityId) return;
    Promise.resolve()
      .then(async () => {
        const data = await getOrganizationEquityDetails(
          accessToken,
          PLATFORM_ADMIN_ORG_ROUTE_PLACEHOLDER,
          securityId
        );
        setDetails(data);
      })
      .catch((err) => {
        showError(err instanceof Error ? err.message : "Failed to load stock details");
        setDetails(null);
      })
      .finally(() => setLoading(false));
  }, [accessToken, securityId, showError]);

  const loadFmpNewsFromDb = useCallback(() => {
    if (!accessToken || !securityId) {
      setFmpNews(null);
      return;
    }
    setFmpNewsLoading(true);
    setFmpNews(null);
    getSecurityFmpNewsCached(accessToken, securityId, { stock_limit: 10, press_limit: 10 })
      .then(setFmpNews)
      .catch((err) => {
        showError(err instanceof Error ? err.message : "Failed to load cached FMP news");
        setFmpNews(null);
      })
      .finally(() => setFmpNewsLoading(false));
  }, [accessToken, securityId, showError]);

  useEffect(() => {
    loadFmpNewsFromDb();
  }, [loadFmpNewsFromDb]);

  useEffect(() => {
    setFmpNewsExpanded(false);
  }, [fmpNews, securityId]);

  const handleIngestFmpNews = useCallback(async () => {
    if (!accessToken || !securityId) return;
    setFmpNewsIngestLoading(true);
    try {
      const result = await ingestSecurityFmpNewsFromFmp(accessToken, securityId, {
        stock_limit: 10,
        press_limit: 10,
      });
      const w = result.warnings.length ? ` — ${result.warnings.join(" — ")}` : "";
      if (result.upserted === 0 && result.stock_news_rows === 0 && result.press_release_rows === 0) {
        showError(
          `No FMP news or press releases were returned for this ticker (0 upserts).${w || " Check REST API FMP_API_KEY, plan limits, and ticker."}`
        );
      } else {
        showSuccess(
          `Saved FMP news: ${result.stock_news_rows} headline(s), ${result.press_release_rows} press row(s) (${result.upserted} upsert(s)).${w}`
        );
      }
      const data = await getSecurityFmpNewsCached(accessToken, securityId, {
        stock_limit: 10,
        press_limit: 10,
      });
      setFmpNews(data);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to ingest FMP news");
    } finally {
      setFmpNewsIngestLoading(false);
    }
  }, [accessToken, securityId, showError, showSuccess]);

  useEffect(() => {
    if (!accessToken) return;
    fetchMyOrganizations(accessToken)
      .then((orgs) => {
        setMyOrgs(orgs);
        setWatchlistOrgId((prev) => {
          if (prev && orgs.some((o) => o.id === prev)) return prev;
          return orgs[0]?.id ?? "";
        });
      })
      .catch(() => {
        setMyOrgs([]);
        setWatchlistOrgId("");
      });
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !watchlistOrgId) {
      setWatchlistClients([]);
      setWatchlistClientId("");
      return;
    }
    listOrganizationClients(accessToken, watchlistOrgId)
      .then((rows) => {
        setWatchlistClients(rows);
        setWatchlistClientId((prev) => {
          if (prev && rows.some((c) => c.id === prev)) return prev;
          return rows[0]?.id ?? "";
        });
      })
      .catch(() => {
        setWatchlistClients([]);
        setWatchlistClientId("");
      });
  }, [accessToken, watchlistOrgId]);

  useEffect(() => {
    if (!accessToken || !watchlistOrgId) {
      setWatchlistsForAdd([]);
      setSelectedWatchlistIdForAdd("");
      return;
    }
    if (watchlistScope === "client" && !watchlistClientId) {
      setWatchlistsForAdd([]);
      setSelectedWatchlistIdForAdd("");
      return;
    }
    setWatchlistsMetaLoading(true);
    const params =
      watchlistScope === "global"
        ? { global_only: true as const }
        : { organization_client_id: watchlistClientId };
    listOrganizationWatchlists(accessToken, watchlistOrgId, params)
      .then((rows) => {
        setWatchlistsForAdd(rows);
        setSelectedWatchlistIdForAdd((prev) =>
          prev && rows.some((w) => w.id === prev) ? prev : rows[0]?.id ?? ""
        );
      })
      .catch((err) => {
        showError(err instanceof Error ? err.message : "Failed to load watchlists");
        setWatchlistsForAdd([]);
        setSelectedWatchlistIdForAdd("");
      })
      .finally(() => setWatchlistsMetaLoading(false));
  }, [accessToken, watchlistOrgId, watchlistScope, watchlistClientId, showError]);

  const handleAddToWatchlist = useCallback(async () => {
    if (!accessToken || !securityId || !selectedWatchlistIdForAdd || !watchlistOrgId) return;
    setWatchlistAddSubmitting(true);
    try {
      await addOrganizationWatchlistSecurity(accessToken, watchlistOrgId, selectedWatchlistIdForAdd, {
        security_id: securityId,
      });
      showSuccess(
        details?.security.ticker
          ? `Added ${details.security.ticker} to the watchlist.`
          : "Added to the watchlist."
      );
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to add to watchlist");
    } finally {
      setWatchlistAddSubmitting(false);
    }
  }, [
    accessToken,
    securityId,
    selectedWatchlistIdForAdd,
    watchlistOrgId,
    details?.security.ticker,
    showError,
    showSuccess,
  ]);

  const loadChart = useCallback(
    (ticker: string, range: StockChartRange) => {
      if (!accessToken) return;
      setChartLoading(true);
      getStockChart(accessToken, ticker, range)
        .then(setChartData)
        .catch((err) => showError(err instanceof Error ? err.message : "Failed to load chart"))
        .finally(() => setChartLoading(false));
    },
    [accessToken, showError]
  );

  useEffect(() => {
    if (details?.security.ticker) {
      loadChart(details.security.ticker, chartRange);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details?.security.ticker, chartRange, loadChart]);

  const handleIngestChartFromFmp = useCallback(async () => {
    if (!accessToken || !securityId || !details?.security.ticker) return;
    setChartIngestLoading(true);
    try {
      const result = await ingestStockChartBarsFromFmp(accessToken, securityId, chartRange);
      const parts = Object.entries(result.intervals)
        .map(([k, n]) => `${k}: ${n}`)
        .join(", ");
      const totalUpserted = Object.values(result.intervals).reduce((a, b) => a + (b ?? 0), 0);
      const detail = result.errors.length ? result.errors.join(" ") : "";
      if (totalUpserted === 0) {
        showError(
          detail ||
            `No rows were saved for ${result.chart_range} (${parts}). Check FMP plan (intraday needs a paid tier) and API key.`
        );
      } else {
        const warn = result.errors.length ? ` ${detail}` : "";
        showSuccess(`Saved ${result.chart_range} chart (${parts}).${warn}`);
      }
      loadChart(details.security.ticker, chartRange);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to ingest chart data from FMP");
    } finally {
      setChartIngestLoading(false);
    }
  }, [
    accessToken,
    securityId,
    details?.security.ticker,
    chartRange,
    loadChart,
    showError,
    showSuccess,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
        <p className="text-sm text-muted-foreground">No details available for this stock.</p>
      </div>
    );
  }

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <Link
            href={`${ADMIN_DASHBOARD}/screener`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to screener
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">
            {details.security.ticker} · {details.security.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Exchange: {details.security.primary_exchange ?? "—"} · Market cap:{" "}
            {formatMarketCap(details.security.market_cap)}
          </p>
        </div>

        <FormulaShareSection
          shareTitle={`${details.security.ticker} — ${details.security.name}`}
        />

        <AdminSocialPublishSection
          shareTitle={`${details.security.ticker} — ${details.security.name}`}
          ticker={details.security.ticker}
          shareSummary={`${details.security.name} on ${details.security.primary_exchange ?? "market"}`}
        />

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Price chart</CardTitle>
              {chartData && chartData.points.length > 0 && (() => {
                const ch = priceChange(chartData.points);
                const last = chartData.points[chartData.points.length - 1].close;
                if (!ch) return null;
                const up = ch.diff >= 0;
                return (
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold tabular-nums">${last.toFixed(2)}</span>
                    <span className={`text-sm font-medium ${up ? "text-green-500" : "text-red-500"}`}>
                      {up ? "+" : ""}{ch.diff.toFixed(2)} ({up ? "+" : ""}{ch.pct.toFixed(2)}%)
                    </span>
                    <span className="text-xs text-muted-foreground">{chartRange}</span>
                  </div>
                );
              })()}
            </div>
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={chartIngestLoading || !details.security.ticker}
                onClick={() => void handleIngestChartFromFmp()}
              >
                {chartIngestLoading ? "Syncing…" : `Sync ${chartRange} from FMP`}
              </Button>
              <div className="flex gap-1 flex-wrap justify-end">
                {CHART_RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                      chartRange === r
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            <StockPriceChart chartLoading={chartLoading} chartData={chartData} chartRange={chartRange} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <p>Type: {details.security.type_description ?? "—"}</p>
            <p>Employees: {formatNumber(details.security.total_employees)}</p>
            <p>Listed: {details.security.list_date ?? "—"}</p>
            <p>
              Website:{" "}
              {details.security.homepage_url ? (
                <a href={details.security.homepage_url} target="_blank" rel="noreferrer" className="underline">
                  {details.security.homepage_url}
                </a>
              ) : (
                "—"
              )}
            </p>
            <p className="md:col-span-2">Description: {details.security.description ?? "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>FMP news &amp; press releases</CardTitle>
              <CardDescription className="mt-1">
                Cached headlines and press releases — preview shows {FMP_NEWS_PREVIEW_EACH} per column.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={fmpNewsIngestLoading || !securityId}
              onClick={() => void handleIngestFmpNews()}
            >
              {fmpNewsIngestLoading ? "Syncing…" : "Sync from FMP → database"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fmpNewsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : fmpNews ? (
              <>
                {fmpNews.stock_news.length === 0 && fmpNews.press_releases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No cached rows yet — run &quot;Sync from FMP → database&quot; above (platform admin).
                  </p>
                ) : null}
                {fmpNews.warnings.length > 0 && (
                  <ul className="list-inside list-disc text-xs text-amber-600 dark:text-amber-500">
                    {fmpNews.warnings.map((w, wi) => (
                      <li key={`${wi}-${w}`}>{w}</li>
                    ))}
                  </ul>
                )}
                <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
                  {(() => {
                    const stockSlice = fmpNewsExpanded
                      ? fmpNews.stock_news
                      : fmpNews.stock_news.slice(0, FMP_NEWS_PREVIEW_EACH);
                    const pressSlice = fmpNewsExpanded
                      ? fmpNews.press_releases
                      : fmpNews.press_releases.slice(0, FMP_NEWS_PREVIEW_EACH);
                    const total = fmpNews.stock_news.length + fmpNews.press_releases.length;
                    const hasMore =
                      fmpNews.stock_news.length > FMP_NEWS_PREVIEW_EACH ||
                      fmpNews.press_releases.length > FMP_NEWS_PREVIEW_EACH;
                    const listShell = fmpNewsExpanded
                      ? "flex flex-1 flex-col divide-y divide-border/80 rounded-md border border-border/60"
                      : "flex min-h-[220px] flex-1 flex-col divide-y divide-border/80 rounded-md border border-border/60 lg:min-h-[240px]";
                    return (
                      <>
                        <div className="flex min-h-0 flex-col gap-2">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Stock news{" "}
                            <span className="font-normal tabular-nums">({fmpNews.stock_news.length})</span>
                          </h3>
                          {fmpNews.stock_news.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No headline rows.</p>
                          ) : (
                            <ul className={listShell}>
                              {stockSlice.map((n, i) => (
                                <li key={`${n.title}-${i}`} className="px-3 py-2.5 text-sm">
                                  <p className="text-xs text-muted-foreground">
                                    {formatFmpNewsDate(n.published_at)}
                                    {n.source ? ` · ${n.source}` : ""}
                                  </p>
                                  <p className="mt-0.5 font-medium leading-snug">
                                    {n.url ? (
                                      <a
                                        href={n.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline-offset-2 hover:underline"
                                      >
                                        {n.title}
                                      </a>
                                    ) : (
                                      n.title
                                    )}
                                  </p>
                                  {n.summary ? (
                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.summary}</p>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="flex min-h-0 flex-col gap-2">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Press releases{" "}
                            <span className="font-normal tabular-nums">({fmpNews.press_releases.length})</span>
                          </h3>
                          {fmpNews.press_releases.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No press rows.</p>
                          ) : (
                            <ul className={listShell}>
                              {pressSlice.map((pr, i) => (
                                <li key={`${pr.title}-${i}`} className="px-3 py-2.5 text-sm">
                                  <p className="text-xs text-muted-foreground">{formatFmpNewsDate(pr.published_at)}</p>
                                  <p className="mt-0.5 font-medium leading-snug">
                                    {pr.url ? (
                                      <a
                                        href={pr.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline-offset-2 hover:underline"
                                      >
                                        {pr.title}
                                      </a>
                                    ) : (
                                      pr.title
                                    )}
                                  </p>
                                  {pr.text ? (
                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{pr.text}</p>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        {hasMore ? (
                          <div className="flex justify-center border-t border-border/60 pt-1 lg:col-span-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => setFmpNewsExpanded((v) => !v)}
                            >
                              {fmpNewsExpanded ? "Show less" : `Show all (${total})`}
                            </Button>
                          </div>
                        ) : null}
                      </>
                    );
                  })()}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">News could not be loaded.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formula scores</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <p>Fundamental constriction: {formatScore(details.scores.fundamental_constriction_score)}</p>
            <p>Net exposure: {formatScore(details.scores.net_exposure_score)}</p>
            <p>Insider conviction: {formatScore(details.scores.insider_conviction_score)}</p>
            <p>Political score: {formatScore(details.scores.political_score)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>Active tag assignments (latest as-of date per tag).</CardDescription>
          </CardHeader>
          <CardContent>
            {(details.tags ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No tags linked to this security.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {(details.tags ?? []).map((t) => (
                  <li key={t.tag_id}>
                    <Badge variant="secondary" className="font-normal">
                      <span className="text-muted-foreground">{t.group} · </span>
                      {t.name}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exposures</CardTitle>
            <CardDescription>Theme exposures (latest as-of date per exposure and direction).</CardDescription>
          </CardHeader>
          <CardContent>
            {(details.exposures ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No exposures linked to this security.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Exposure</th>
                      <th className="py-2 pr-3 font-medium">Category</th>
                      <th className="py-2 pr-3 font-medium">Polarity</th>
                      <th className="py-2 pr-3 font-medium">Direction</th>
                      <th className="py-2 pr-3 font-medium">Strength</th>
                      <th className="py-2 pr-3 font-medium">Confidence</th>
                      <th className="py-2 pr-3 font-medium">As of</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(details.exposures ?? []).map((e) => (
                      <tr key={`${e.exposure_id}-${e.direction}`} className="border-b border-border/60">
                        <td className="py-2 pr-3">{e.name}</td>
                        <td className="py-2 pr-3">{e.category}</td>
                        <td className="py-2 pr-3">{formatExposurePolarity(e.polarity)}</td>
                        <td className="py-2 pr-3 capitalize">{e.direction.replace(/_/g, " ")}</td>
                        <td className="py-2 pr-3">{formatScore(e.strength)}</td>
                        <td className="py-2 pr-3">{formatScore(e.confidence)}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{e.as_of_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add to watchlist</CardTitle>
            <CardDescription>
              Watchlists belong to your user within an organization. Global lists have no client; client lists are
              scoped to a client record.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myOrgs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No organization memberships on this account, so there is nowhere to save a watchlist yet. Use an org
                account or join an organization, then try again.
              </p>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="watchlist-org">Organization</Label>
                    <select
                      id="watchlist-org"
                      className={selectTriggerClass}
                      value={watchlistOrgId}
                      onChange={(e) => setWatchlistOrgId(e.target.value)}
                    >
                      {myOrgs.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium leading-none">Scope</span>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={watchlistScope === "global" ? "default" : "outline"}
                        onClick={() => setWatchlistScope("global")}
                      >
                        Global
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={watchlistScope === "client" ? "default" : "outline"}
                        onClick={() => setWatchlistScope("client")}
                      >
                        Client
                      </Button>
                    </div>
                  </div>
                </div>
                {watchlistScope === "client" && (
                  <div className="space-y-2">
                    <Label htmlFor="watchlist-client">Client</Label>
                    <select
                      id="watchlist-client"
                      className={selectTriggerClass}
                      value={watchlistClientId}
                      onChange={(e) => setWatchlistClientId(e.target.value)}
                      disabled={watchlistClients.length === 0}
                    >
                      {watchlistClients.length === 0 ? (
                        <option value="">No clients in this organization</option>
                      ) : (
                        watchlistClients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="watchlist-pick">Watchlist</Label>
                  {watchlistsMetaLoading ? (
                    <div className="flex h-9 items-center">
                      <Spinner />
                    </div>
                  ) : (
                    <select
                      id="watchlist-pick"
                      className={selectTriggerClass}
                      value={selectedWatchlistIdForAdd}
                      onChange={(e) => setSelectedWatchlistIdForAdd(e.target.value)}
                      disabled={watchlistsForAdd.length === 0}
                    >
                      {watchlistsForAdd.length === 0 ? (
                        <option value="">No watchlists in this scope</option>
                      ) : (
                        watchlistsForAdd.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                            {w.organization_client_id == null ? " (global)" : ""}
                          </option>
                        ))
                      )}
                    </select>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    disabled={
                      watchlistAddSubmitting ||
                      !securityId ||
                      !selectedWatchlistIdForAdd ||
                      watchlistsForAdd.length === 0 ||
                      (watchlistScope === "client" && (!watchlistClientId || watchlistClients.length === 0))
                    }
                    onClick={() => void handleAddToWatchlist()}
                  >
                    {watchlistAddSubmitting ? "Adding…" : `Add ${details.security.ticker}`}
                  </Button>
                  <Link
                    href={`${ORG_DASHBOARD}/watchlists`}
                    className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    Manage watchlists (org)
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
