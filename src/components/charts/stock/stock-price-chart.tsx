"use client";

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
import { Spinner } from "@/components/ui/spinner";
import type { StockChartData, StockChartPoint, StockChartRange } from "@/lib/api";

type StockPriceChartProps = {
  chartLoading: boolean;
  chartData: StockChartData | null;
  chartRange: StockChartRange;
};

type StockChartTooltipContentProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: StockChartPoint & { xLabel: string } }>;
  range: StockChartRange;
};

const INTRADAY_RANGES = new Set<StockChartRange>(["1D", "5D"]);

function formatXAxis(ts: string, range: StockChartRange): string {
  const d = new Date(ts);
  if (range === "1D") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (range === "5D") {
    return (
      d.toLocaleDateString([], { weekday: "short" }) +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }
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
  const { y: bodyTop = 0, height: bodyHeight = 0 } = props;
  const clampedHeight = Math.max(bodyHeight, 1);
  const cx = x + width / 2;

  // Recharts injects yAxis with scale into custom shape props.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scale = (props as any).yAxis?.scale as ((v: number) => number) | undefined;
  const wickTop = scale ? scale(highV) : bodyTop;
  const wickBottom = scale ? scale(lowV) : bodyTop + clampedHeight;

  return (
    <g>
      <line x1={cx} y1={wickTop} x2={cx} y2={wickBottom} stroke={color} strokeWidth={1} />
      <rect
        x={x + width * 0.1}
        y={bodyTop}
        width={width * 0.8}
        height={clampedHeight}
        fill={color}
        stroke={color}
      />
    </g>
  );
}

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
        {d.open != null && (
          <>
            <span className="text-muted-foreground">Open</span>
            <span className="font-mono">${d.open.toFixed(2)}</span>
          </>
        )}
        {d.high != null && (
          <>
            <span className="text-muted-foreground">High</span>
            <span className="font-mono text-green-500">${d.high.toFixed(2)}</span>
          </>
        )}
        {d.low != null && (
          <>
            <span className="text-muted-foreground">Low</span>
            <span className="font-mono text-red-500">${d.low.toFixed(2)}</span>
          </>
        )}
        <span className="text-muted-foreground">Close</span>
        <span className={`font-mono font-semibold ${isUp ? "text-green-500" : "text-red-500"}`}>
          ${d.close.toFixed(2)}
        </span>
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

function AreaTooltip({ active, payload, range }: StockChartTooltipContentProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as (StockChartPoint & { xLabel: string }) | undefined;
  if (!d) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-xs shadow-md">
      <p className="mb-1 font-medium text-muted-foreground">{formatTooltipDate(d.ts, range)}</p>
      <p className="font-mono font-semibold">${d.close.toFixed(2)}</p>
      {d.volume != null && <p className="text-muted-foreground">{(d.volume / 1_000_000).toFixed(2)}M vol</p>}
    </div>
  );
}

export function StockPriceChart({ chartLoading, chartData, chartRange }: StockPriceChartProps) {
  if (chartLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!chartData || chartData.points.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No chart data available.</p>;
  }

  const chartPoints = chartData.points.map((p) => ({ ...p, xLabel: formatXAxis(p.ts, chartRange) }));

  if (INTRADAY_RANGES.has(chartRange)) {
    return (
      <div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartPoints} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
        {chartData.points.some((p) => p.volume != null) && (
          <ResponsiveContainer width="100%" height={60}>
            <ComposedChart data={chartPoints} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
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
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartPoints} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
  );
}
