"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  fetchMyOrganizations,
  getOrganizationEquityDetails,
  getStockChart,
  type OrgEquityDetails,
  type StockChartData,
  type StockChartPoint,
  type StockChartRange,
} from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormulaScoreBreakdownSection } from "@/components/formulas/formula-score-breakdown-section";
import { ScoreEvidenceAnchorsPanel } from "@/components/formulas/score-evidence-anchors-panel";
import { Spinner } from "@/components/ui/spinner";
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

/** Recharts v3 tooltip content props (TooltipProps no longer exposes payload the same way). */
type StockChartTooltipContentProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: StockChartPoint & { xLabel: string } }>;
  range: StockChartRange;
};

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

const CHART_RANGES: StockChartRange[] = ["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "MAX"];

// 1D (5min bars) and 5D (15min bars) → candlestick + volume
// 1M and above use daily line bars (close only) → area chart
const INTRADAY_RANGES = new Set<StockChartRange>(["1D", "5D"]);

function formatXAxis(ts: string, range: StockChartRange): string {
  const d = new Date(ts);
  if (range === "1D") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (range === "5D") return d.toLocaleDateString([], { weekday: "short" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (range === "1M") return d.toLocaleDateString([], { month: "short", day: "numeric" });
  if (range === "MAX") return d.toLocaleDateString([], { year: "numeric", month: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatTooltipDate(ts: string, range: StockChartRange): string {
  const d = new Date(ts);
  if (INTRADAY_RANGES.has(range)) {
    return (
      d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) +
      "  " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function priceChange(points: StockChartPoint[]): { diff: number; pct: number } | null {
  if (points.length < 2) return null;
  const first = points[0].close;
  const last = points[points.length - 1].close;
  return { diff: last - first, pct: ((last - first) / first) * 100 };
}

// Custom candlestick bar rendered inside ComposedChart
function CandlestickBar(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: StockChartPoint & { xLabel: string };
}) {
  const { x = 0, width = 0, payload } = props;
  if (!payload) return null;
  const { open, high, low, close } = payload;
  const openV = open ?? close;
  const highV = high ?? close;
  const lowV = low ?? close;
  const isUp = close >= openV;
  const color = isUp ? "#22c55e" : "#ef4444";
  // We receive `y` and `height` for the bar body from recharts, but we need to
  // map price values ourselves. This component is used as a custom shape so
  // recharts passes the mapped coordinates.
  // yAxis domain must be set so we can access the scale via the yAxis prop passed by recharts.
  // Use the recharts internal scale via the passed yAxis prop.
  // Since recharts passes x/y/width/height for the bar, we get body coords and
  // re-derive wick positions from the same scale.
  const { y: bodyTop = 0, height: bodyHeight = 0 } = props;

  // Prevent zero-height flicker on very small candles
  const clampedHeight = Math.max(bodyHeight, 1);
  const cx = x + width / 2;

  // For wicks we need the chart scale. Recharts injects `yAxis` into the props
  // of custom shapes, but TypeScript doesn't know about it. We cast to access it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scale = (props as any).yAxis?.scale as ((v: number) => number) | undefined;
  const wickTop = scale ? scale(highV) : bodyTop;
  const wickBottom = scale ? scale(lowV) : bodyTop + clampedHeight;

  return (
    <g>
      {/* wick */}
      <line x1={cx} y1={wickTop} x2={cx} y2={wickBottom} stroke={color} strokeWidth={1} />
      {/* body */}
      <rect
        x={x + width * 0.1}
        y={isUp ? bodyTop : bodyTop}
        width={width * 0.8}
        height={clampedHeight}
        fill={color}
        stroke={color}
      />
    </g>
  );
}

// Tooltip for candlestick chart
function CandlestickTooltip({ active, payload, range }: StockChartTooltipContentProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as (StockChartPoint & { xLabel: string }) | undefined;
  if (!d) return null;
  const openV = d.open ?? d.close;
  const isUp = d.close >= openV;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-muted-foreground">{formatTooltipDate(d.ts, range)}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {d.open != null && <><span className="text-muted-foreground">Open</span><span className="font-mono">${d.open.toFixed(2)}</span></>}
        {d.high != null && <><span className="text-muted-foreground">High</span><span className="font-mono text-green-500">${d.high.toFixed(2)}</span></>}
        {d.low != null && <><span className="text-muted-foreground">Low</span><span className="font-mono text-red-500">${d.low.toFixed(2)}</span></>}
        <span className="text-muted-foreground">Close</span>
        <span className={`font-mono font-semibold ${isUp ? "text-green-500" : "text-red-500"}`}>${d.close.toFixed(2)}</span>
        {d.volume != null && (
          <>
            <span className="text-muted-foreground">Volume</span>
            <span className="font-mono">{(d.volume / 1_000_000).toFixed(2)}M</span>
          </>
        )}
      </div>
    </div>
  );
}

// Tooltip for area (daily) chart
function AreaTooltip({ active, payload, range }: StockChartTooltipContentProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as (StockChartPoint & { xLabel: string }) | undefined;
  if (!d) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-xs shadow-md">
      <p className="mb-1 font-medium text-muted-foreground">{formatTooltipDate(d.ts, range)}</p>
      <p className="font-mono font-semibold">${d.close.toFixed(2)}</p>
      {d.volume != null && (
        <p className="text-muted-foreground">{(d.volume / 1_000_000).toFixed(2)}M vol</p>
      )}
    </div>
  );
}

export default function StockDetailsPage() {
  const params = useParams<{ securityId: string }>();
  const securityId = params?.securityId;
  const { accessToken } = useAuth();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<OrgEquityDetails | null>(null);

  const [chartRange, setChartRange] = useState<StockChartRange>("1D");
  const [chartData, setChartData] = useState<StockChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    if (!accessToken || !securityId) return;
    fetchMyOrganizations(accessToken)
      .then(async (orgs) => {
        if (orgs.length === 0) throw new Error("No organization found");
        const data = await getOrganizationEquityDetails(accessToken, orgs[0].id, securityId);
        setDetails(data);
      })
      .catch((err) => {
        showError(err instanceof Error ? err.message : "Failed to load stock details");
        setDetails(null);
      })
      .finally(() => setLoading(false));
  }, [accessToken, securityId, showError]);

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
          <Link href="/org/dashboard/screener" className="text-sm text-muted-foreground hover:text-foreground">
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
          </CardHeader>
          <CardContent className="p-0 pb-4">
            {chartLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Spinner />
              </div>
            ) : !chartData || chartData.points.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No chart data available.</p>
            ) : INTRADAY_RANGES.has(chartRange) ? (
              /* ── Candlestick + Volume (intraday: 1D, 5D, 1M) ── */
              <div>
                {/* Price pane */}
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart
                    data={chartData.points.map((p) => ({ ...p, xLabel: formatXAxis(p.ts, chartRange) }))}
                    margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                    <XAxis
                      dataKey="xLabel"
                      tick={{ fontSize: 10, fill: "gray" }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      minTickGap={40}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "gray" }}
                      tickLine={false}
                      axisLine={false}
                      domain={["auto", "auto"]}
                      tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                      width={56}
                      orientation="right"
                    />
                    <Tooltip content={<CandlestickTooltip range={chartRange} />} />
                    {/* Candlestick body rendered as a Bar with custom shape */}
                    <Bar
                      dataKey="close"
                      shape={(props: object) => <CandlestickBar {...(props as Parameters<typeof CandlestickBar>[0])} />}
                      isAnimationActive={false}
                      maxBarSize={12}
                    >
                      {chartData.points.map((p, i) => (
                        <Cell key={i} fill={p.close >= (p.open ?? p.close) ? "#22c55e" : "#ef4444"} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
                {/* Volume pane */}
                {chartData.points.some((p) => p.volume != null) && (
                  <ResponsiveContainer width="100%" height={60}>
                    <ComposedChart
                      data={chartData.points.map((p) => ({ ...p, xLabel: formatXAxis(p.ts, chartRange) }))}
                      margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                    >
                      <XAxis dataKey="xLabel" hide />
                      <YAxis
                        tick={{ fontSize: 9, fill: "gray" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `${(v / 1e6).toFixed(0)}M`}
                        width={56}
                        orientation="right"
                        tickCount={2}
                      />
                      <Bar dataKey="volume" maxBarSize={12} isAnimationActive={false}>
                        {chartData.points.map((p, i) => (
                          <Cell key={i} fill={p.close >= (p.open ?? p.close) ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"} />
                        ))}
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              /* ── Area chart (daily: 3M, 6M, YTD, 1Y, 5Y, MAX) ── */
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={chartData.points.map((p) => ({ ...p, xLabel: formatXAxis(p.ts, chartRange) }))}
                  margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis
                    dataKey="xLabel"
                    tick={{ fontSize: 10, fill: "gray" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={50}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "gray" }}
                    tickLine={false}
                    axisLine={false}
                    domain={["auto", "auto"]}
                    tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                    width={56}
                    orientation="right"
                  />
                  <Tooltip content={<AreaTooltip range={chartRange} />} />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#areaGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#6366f1" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
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
          <CardHeader>
            <CardTitle>Taxonomy (24m)</CardTitle>
            <CardDescription>Sector hierarchy and cycle directions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <p>Sector: {details.taxonomy.sector_title ?? "—"}</p>
            <p>Sector cycle: {formatScore(details.taxonomy.sector_cycle)}</p>
            <p>Industry: {details.taxonomy.industry_title ?? "—"}</p>
            <p>Industry cycle: {formatScore(details.taxonomy.industry_cycle)}</p>
            <p>Sub-industry: {details.taxonomy.sub_industry_title ?? "—"}</p>
            <p>Sub-industry cycle: {formatScore(details.taxonomy.sub_industry_cycle)}</p>
          </CardContent>
        </Card>

        <ScoreEvidenceAnchorsPanel
          anchors={
            details.anchors ?? {
              insider: [],
              hedge_fund: [],
              earnings: [],
              macro: [],
            }
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Formula scores</CardTitle>
            <CardDescription>
              Expand any score to see why this security ranked that way, then jump to evidence
              anchors above.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormulaScoreBreakdownSection
              scores={details.scores}
              scoreBreakdowns={details.score_breakdowns ?? {
                fundamental_constriction_score: null,
                net_exposure_score: null,
                insider_precision_score: null,
                political_score: null,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event sentiment + jobs factors</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <p>Positive events (30d): {formatNumber(details.sentiment.positive_event_count_30d)}</p>
            <p>Negative events (30d): {formatNumber(details.sentiment.negative_event_count_30d)}</p>
            <p>Positive events (90d): {formatNumber(details.sentiment.positive_event_count_90d)}</p>
            <p>Negative events (90d): {formatNumber(details.sentiment.negative_event_count_90d)}</p>
            <p>Event pressure (30d): {formatScore(details.sentiment.event_pressure_30d)}</p>
            <p>Event pressure (90d): {formatScore(details.sentiment.event_pressure_90d)}</p>
            <p>Event pressure trend: {formatScore(details.sentiment.event_pressure_trend)}</p>
            <p>Jobs per 100 employees: {formatScore(details.jobs.jobs_per_100_employees)}</p>
            <p>Jobs growth (30d): {formatScore(details.jobs.jobs_growth_rate_30d)}</p>
            <p>Jobs growth (90d): {formatScore(details.jobs.jobs_growth_rate_90d)}</p>
            <p>Workforce growth (90d): {formatScore(details.jobs.workforce_growth_rate_90d)}</p>
            <p>Hiring spike indicator: {formatScore(details.jobs.hiring_spike_indicator)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
