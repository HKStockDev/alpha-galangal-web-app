import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const mockData = [
  {
    ticker: "NVDA",
    name: "NVIDIA Corp",
    score: 94,
    momentum: "+12.4%",
    insider: "Buying",
    political: "Active",
  },
  {
    ticker: "COST",
    name: "Costco Wholesale",
    score: 91,
    momentum: "+8.2%",
    insider: "Buying",
    political: "Moderate",
  },
  {
    ticker: "LLY",
    name: "Eli Lilly & Co",
    score: 89,
    momentum: "+15.7%",
    insider: "Neutral",
    political: "Active",
  },
  {
    ticker: "META",
    name: "Meta Platforms",
    score: 87,
    momentum: "+6.3%",
    insider: "Buying",
    political: "Low",
  },
  {
    ticker: "UNH",
    name: "UnitedHealth Group",
    score: 85,
    momentum: "+4.1%",
    insider: "Buying",
    political: "Moderate",
  },
];

interface DashboardPreviewProps {
  className?: string;
}

export function DashboardPreview({ className }: DashboardPreviewProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border/60 bg-card shadow-lg",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-border" />
            <div className="h-3 w-3 rounded-full bg-border" />
            <div className="h-3 w-3 rounded-full bg-border" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Factor Screener — Custom Model
          </span>
        </div>
        <Badge variant="secondary" className="text-xs">
          5 Results
        </Badge>
      </div>

      <div className="grid grid-cols-7 gap-x-4 border-b border-border/40 bg-muted/20 px-4 py-2 text-xs font-medium text-muted-foreground">
        <div>Ticker</div>
        <div className="col-span-2">Company</div>
        <div className="text-right">Score</div>
        <div className="text-right">Momentum</div>
        <div>Insider</div>
        <div>Political</div>
      </div>

      <div className="divide-y divide-border/30">
        {mockData.map((row, i) => (
          <div
            key={row.ticker}
            className={cn(
              "grid grid-cols-7 items-center gap-x-4 px-4 py-3 text-sm transition-colors hover:bg-muted/20",
              i === 0 && "bg-secondary/20"
            )}
          >
            <div className="font-mono font-semibold text-primary">
              {row.ticker}
            </div>
            <div className="col-span-2 truncate text-foreground">{row.name}</div>
            <div className="text-right">
              <span className="inline-flex h-6 min-w-[2.5rem] items-center justify-center rounded bg-primary/10 px-2 font-mono text-xs font-semibold text-primary">
                {row.score}
              </span>
            </div>
            <div className="text-right font-mono text-xs text-emerald-600 dark:text-emerald-400">
              {row.momentum}
            </div>
            <div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  row.insider === "Buying" &&
                    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
                  row.insider === "Neutral" &&
                    "border-slate-200 bg-slate-50 text-slate-600 dark:border-border dark:bg-muted dark:text-muted-foreground"
                )}
              >
                {row.insider}
              </Badge>
            </div>
            <div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  row.political === "Active" &&
                    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
                  row.political === "Moderate" &&
                    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
                  row.political === "Low" &&
                    "border-slate-200 bg-slate-50 text-slate-600 dark:border-border dark:bg-muted dark:text-muted-foreground"
                )}
              >
                {row.political}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-4 py-2">
        <span className="text-xs text-muted-foreground">
          Sorted by: Composite Score (desc)
        </span>
        <span className="text-xs text-muted-foreground">
          Model: Quality + Momentum + Insider Alignment
        </span>
      </div>
    </div>
  );
}
