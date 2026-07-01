"use client";

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  getInsiderPrecisionScores,
  calculateInsiderPrecisionScores,
  type InsiderPrecisionCalculateResult,
  type InsiderPrecisionScoreRow,
} from "@/lib/api";
import {
  GhostButton,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui-kit/buttons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui-kit/data-table";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { cn } from "@/lib/utils";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import { AdminFormulaMarketingSection } from "@/components/dashboard/admin-formula-marketing-section";
import { FormulaMarketingPreviewButtons } from "@/components/dashboard/formula-marketing-preview-buttons";
import { FormulaPageResultsSettingsTabs } from "@/components/dashboard/formula-page-results-settings-tabs";
import { INSIDER_PRECISION_MARKETING_KEY } from "@/lib/formula-marketing-keys";
import { ORG_DASHBOARD } from "@/lib/auth-routing";
import { FormulaExplanationSection } from "@/components/formulas/formula-explanation-section";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseTickers(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

function buildBody(
  limit: string,
  tickersText: string,
  minScore: string,
  maxScore: string
): {
  tickers?: string[];
  limit?: number;
  minScore?: number;
  maxScore?: number;
} {
  const body: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  } = {};
  const tickers = parseTickers(tickersText);
  if (tickers.length) body.tickers = tickers;
  const lim = limit.trim() ? parseInt(limit.trim(), 10) : undefined;
  if (lim != null && lim > 0) body.limit = lim;
  const minS = minScore.trim() ? parseFloat(minScore.trim()) : undefined;
  if (minS != null && !Number.isNaN(minS)) body.minScore = minS;
  const maxS = maxScore.trim() ? parseFloat(maxScore.trim()) : undefined;
  if (maxS != null && !Number.isNaN(maxS)) body.maxScore = maxS;
  return body;
}

function fmtScore(n: number): string {
  return n.toFixed(2);
}

function fmtUsd(n: number): string {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function scoreColor(score: number): string {
  if (score >= 60) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 30) return "text-emerald-500/80 dark:text-emerald-500";
  if (score > -30) return "text-muted-foreground";
  if (score > -60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBadge(score: number): { label: string; className: string } {
  if (score >= 60)
    return {
      label: "Strong buying",
      className:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    };
  if (score >= 30)
    return {
      label: "Moderate buying",
      className:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    };
  if (score > -30)
    return {
      label: "Neutral",
      className: "bg-muted text-muted-foreground",
    };
  if (score > -60)
    return {
      label: "Moderate selling",
      className:
        "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    };
  return {
    label: "Strong selling",
    className: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  };
}

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

type SortColumn = "ticker" | "score" | "buyPressure" | "sellPressure" | "tradesUsed";

function SortIconAsc({ className }: { className?: string }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className={cn("shrink-0", className)} aria-hidden>
      <path d="m18 15-6-6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SortIconDesc({ className }: { className?: string }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className={cn("shrink-0", className)} aria-hidden>
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SortIconBoth({ className }: { className?: string }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className={cn("shrink-0", className)} aria-hidden>
      <path d="m8 10 4-4 4 4M8 14l4 4 4-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SortableHead({
  column,
  label,
  activeColumn,
  direction,
  onSort,
  align = "left",
}: {
  column: SortColumn;
  label: string;
  activeColumn: SortColumn | null;
  direction: "asc" | "desc";
  onSort: (c: SortColumn) => void;
  align?: "left" | "right";
}) {
  const active = activeColumn === column;
  return (
    <TableHead className={cn("whitespace-nowrap", align === "right" && "text-right")}>
      <GhostButton
        type="button"
        size="sm"
        onClick={() => onSort(column)}
        className={cn(
          "-mx-1 h-8 gap-1 px-2 font-medium text-foreground hover:text-foreground",
          align === "right" && "w-full min-w-0 justify-end"
        )}
      >
        <span>{label}</span>
        {active ? (
          direction === "asc" ? (
            <SortIconAsc className="text-foreground" />
          ) : (
            <SortIconDesc className="text-foreground" />
          )
        ) : (
          <SortIconBoth className="text-muted-foreground" />
        )}
      </GhostButton>
    </TableHead>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function InsiderPrecisionPage() {
  const pathname = usePathname();
  const showSubheading = pathname?.startsWith(ORG_DASHBOARD) ?? false;
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [limit, setLimit] = useState("");
  const [tickersText, setTickersText] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<InsiderPrecisionCalculateResult | null>(null);
  const [tableSort, setTableSort] = useState<{ column: SortColumn | null; dir: "asc" | "desc" }>({
    column: "score",
    dir: "desc",
  });
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  const sortedRows = useMemo<InsiderPrecisionScoreRow[]>(() => {
    const rows = result?.scores;
    if (!rows?.length) return [];
    if (!tableSort.column) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const dir = tableSort.dir === "asc" ? 1 : -1;
      switch (tableSort.column) {
        case "ticker":
          return dir * a.ticker.localeCompare(b.ticker, undefined, { sensitivity: "base" });
        case "score":
          return dir * (a.score - b.score);
        case "buyPressure":
          return dir * (a.buyPressure - b.buyPressure);
        case "sellPressure":
          return dir * (a.sellPressure - b.sellPressure);
        case "tradesUsed":
          return dir * (a.tradesUsed - b.tradesUsed);
        default:
          return 0;
      }
    });
    return copy;
  }, [result?.scores, tableSort]);

  function handleTableSort(column: SortColumn) {
    setTableSort((prev) =>
      prev.column === column
        ? { column, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { column, dir: column === "ticker" ? "asc" : "desc" }
    );
  }

  const loadScores = useCallback(
    async (
      body: { tickers?: string[]; limit?: number; minScore?: number; maxScore?: number },
      { recalculate = false, toast = true } = {}
    ) => {
      if (!accessToken) return;
      setRunning(true);
      try {
        const fn = recalculate ? calculateInsiderPrecisionScores : getInsiderPrecisionScores;
        const data = await fn(accessToken, body);
        setResult(data);
        if (toast) {
          if (recalculate) {
            showSuccess(
              data.scoresWritten > 0
                ? `Recalculated — ${data.scoresWritten} scores written (${data.tickersWithData} tickers, ${data.tradesUsed} trades used)`
                : "Run finished; no scores written. Ensure insider trades are synced."
            );
          } else if (data.tickersWithData > 0) {
            showSuccess(`Loaded ${data.tickersWithData} insider precision scores`);
          }
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : "Run failed");
      } finally {
        setRunning(false);
      }
    },
    [accessToken, showError, showSuccess]
  );

  // Load persisted scores on mount
  useEffect(() => {
    if (!accessToken) return;
    void loadScores({}, { recalculate: false, toast: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onModalSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setModalOpen(false);
    await loadScores(buildBody(limit, tickersText, minScore, maxScore), {
      recalculate: true,
      toast: true,
    });
  }

  const hasErrors = (result?.errors?.length ?? 0) > 0;
  const filterBody = buildBody(limit, tickersText, minScore, maxScore);

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Insider precision
            </h1>
            {showSubheading ? (
              <p className="text-base text-muted-foreground">
                Directional signal (−100 to +100) from open-market insider buys and sells,
                weighted by executive role, recency, and cluster size, normalised by company
                size.{" "}
                <span className="text-foreground/70">
                  Scores load automatically from the last run.
                </span>
              </p>
            ) : null}
          </div>
          <div className="flex max-w-md shrink-0 flex-wrap items-center justify-end gap-2 self-end sm:justify-end sm:self-start">
            <SecondaryButton
              type="button"
              size="sm"
              disabled={!accessToken || running}
              onClick={() => setModalOpen(true)}
            >
              Custom run
            </SecondaryButton>
            <PrimaryButton
              type="button"
              size="sm"
              disabled={!accessToken || running}
              onClick={() => void loadScores({}, { recalculate: true, toast: true })}
            >
              {running ? "Running…" : "Recalculate"}
            </PrimaryButton>
            <FormulaMarketingPreviewButtons />
          </div>
        </header>

        <FormulaPageResultsSettingsTabs
          results={
            <>
        <FormulaExplanationSection formulaKey={INSIDER_PRECISION_MARKETING_KEY} />

        {/* Score range quick filter */}
        <section className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm">
          <h2 className="text-sm font-medium text-foreground">Score range filter</h2>
          <p className="text-xs text-muted-foreground">
            Applied to the next run (inclusive, −100–100). Leave empty for no bound.
          </p>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5">
              <FormLabel htmlFor="ics-min" className="text-xs font-medium text-muted-foreground">
                Min score
              </FormLabel>
              <FormInput
                id="ics-min"
                inputMode="decimal"
                placeholder="e.g. 30"
                className="w-28"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <FormLabel htmlFor="ics-max" className="text-xs font-medium text-muted-foreground">
                Max score
              </FormLabel>
              <FormInput
                id="ics-max"
                inputMode="decimal"
                placeholder="e.g. 100"
                className="w-28"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
              />
            </div>
            <PrimaryButton
              type="button"
              size="sm"
              disabled={!accessToken || running}
              onClick={() =>
                void loadScores(filterBody, { recalculate: false, toast: true })
              }
            >
              Apply filter
            </PrimaryButton>
          </div>
        </section>

        {/* Interpretation key (color scale) */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-foreground">Interpretation bands</h2>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 lg:grid-cols-5">
            {[
              { range: "> +60", label: "Strong buying", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
              { range: "+30 to +60", label: "Moderate buying", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
              { range: "−30 to +30", label: "Neutral", className: "bg-muted text-muted-foreground" },
              { range: "−60 to −30", label: "Moderate selling", className: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
              { range: "< −60", label: "Strong selling", className: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
            ].map((b) => (
              <div
                key={b.range}
                className={cn("rounded-md px-3 py-2 text-center", b.className)}
              >
                <div className="font-mono font-semibold">{b.range}</div>
                <div className="mt-0.5 text-[11px]">{b.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Custom run dialog */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Custom run — insider precision</DialogTitle>
              <DialogDescription>
                Limit securities, filter by tickers, or set score bounds. Leave empty for
                defaults.
              </DialogDescription>
            </DialogHeader>
            <form id="ics-modal-form" onSubmit={onModalSubmit} className="space-y-4">
              <div className="space-y-2">
                <FormLabel htmlFor="ics-modal-limit" className="text-xs font-medium text-muted-foreground">
                  Max securities (optional)
                </FormLabel>
                <FormInput
                  id="ics-modal-limit"
                  inputMode="numeric"
                  placeholder="e.g. 100 — empty = all active"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="ics-modal-tickers" className="text-xs font-medium text-muted-foreground">
                  Tickers (optional)
                </FormLabel>
                <textarea
                  id="ics-modal-tickers"
                  rows={3}
                  placeholder="AAPL, MSFT — or one per line"
                  value={tickersText}
                  onChange={(e) => setTickersText(e.target.value)}
                  className={cn(
                    "flex min-h-20 w-full resize-y rounded-md border border-input bg-background px-3 py-2",
                    "text-sm shadow-xs outline-none placeholder:text-muted-foreground",
                    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <FormLabel htmlFor="ics-modal-min">Min score</FormLabel>
                  <FormInput
                    id="ics-modal-min"
                    inputMode="decimal"
                    value={minScore}
                    onChange={(e) => setMinScore(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel htmlFor="ics-modal-max">Max score</FormLabel>
                  <FormInput
                    id="ics-modal-max"
                    inputMode="decimal"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Formula: role weight × recency weight × trade value → buy/sell pressure →
                cluster multiplier → tanh normalised by market cap (Formulas.md). Settings
                in Admin → Formulas → Insider precision.
              </p>
            </form>
            <DialogFooter>
              <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" form="ics-modal-form" disabled={running || !accessToken}>
                {running ? "Running…" : "Recalculate scores"}
              </PrimaryButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Loading state */}
        {!accessToken ? (
          <EmptyState compact description="Sign in to load scores." />
        ) : running && !result ? (
          <LoadingSkeleton variant="card" lines={3} className="p-8" />
        ) : null}

        {running && result ? (
          <LoadingSkeleton variant="inline" lines={1} className="max-w-[220px]" />
        ) : null}

        {/* Results */}
        {result ? (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">Results</h2>
              <span className="text-xs text-muted-foreground">
                {result.tickersWithData} tickers scored
              </span>
            </div>

            <ul className="text-sm text-muted-foreground space-y-0.5">
              <li>Securities requested: {result.tickersRequested}</li>
              <li>Securities scored: {result.tickersWithData}</li>
              {result.scoresWritten > 0 && (
                <li>Scores written (last recalculation): {result.scoresWritten}</li>
              )}
              {result.tradesUsed > 0 && (
                <li>Trades used: {result.tradesUsed}</li>
              )}
            </ul>

            {result.scores.length > 0 ? (
              <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-center">Rank</TableHead>
                      <SortableHead
                        column="ticker"
                        label="Ticker"
                        activeColumn={tableSort.column}
                        direction={tableSort.dir}
                        onSort={handleTableSort}
                      />
                      <SortableHead
                        column="score"
                        label="Score"
                        activeColumn={tableSort.column}
                        direction={tableSort.dir}
                        onSort={handleTableSort}
                        align="right"
                      />
                      <TableHead className="hidden text-center sm:table-cell">Signal</TableHead>
                      <SortableHead
                        column="buyPressure"
                        label="Buy pressure"
                        activeColumn={tableSort.column}
                        direction={tableSort.dir}
                        onSort={handleTableSort}
                        align="right"
                      />
                      <SortableHead
                        column="sellPressure"
                        label="Sell pressure"
                        activeColumn={tableSort.column}
                        direction={tableSort.dir}
                        onSort={handleTableSort}
                        align="right"
                      />
                      <SortableHead
                        column="tradesUsed"
                        label="Trades"
                        activeColumn={tableSort.column}
                        direction={tableSort.dir}
                        onSort={handleTableSort}
                        align="right"
                      />
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRows.map((row) => {
                      const badge = scoreBadge(row.score);
                      const isExpanded = expandedTicker === row.ticker;
                      return (
                        <React.Fragment key={row.ticker}>
                          <TableRow

                            className="cursor-pointer hover:bg-muted/40"
                            onClick={() =>
                              setExpandedTicker((prev) =>
                                prev === row.ticker ? null : row.ticker
                              )
                            }
                          >
                            <TableCell className="text-center text-xs tabular-nums text-muted-foreground">
                              {row.rank ?? "—"}
                            </TableCell>
                            <TableCell className="font-semibold">{row.ticker}</TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-mono tabular-nums font-semibold",
                                scoreColor(row.score)
                              )}
                            >
                              {fmtScore(row.score)}
                            </TableCell>
                            <TableCell className="hidden text-center sm:table-cell">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                                  badge.className
                                )}
                              >
                                {badge.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-xs text-emerald-600 dark:text-emerald-400">
                              {fmtUsd(row.buyPressure)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-xs text-red-600 dark:text-red-400">
                              {fmtUsd(row.sellPressure)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-xs text-muted-foreground">
                              {row.tradesUsed}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              <svg
                                width={14}
                                height={14}
                                viewBox="0 0 24 24"
                                fill="none"
                                className={cn(
                                  "mx-auto transition-transform",
                                  isExpanded && "rotate-180"
                                )}
                              >
                                <path
                                  d="m6 9 6 6 6-6"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow className="bg-muted/20">
                              <TableCell colSpan={8} className="py-3">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1 px-2 text-xs text-muted-foreground sm:grid-cols-4">
                                  <div>
                                    <span className="font-medium text-foreground">Net pressure</span>
                                    <div className={cn("font-mono tabular-nums", scoreColor(row.score))}>
                                      {fmtUsd(row.netPressure)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium text-foreground">Buy pressure</span>
                                    <div className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                                      {fmtUsd(row.buyPressure)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium text-foreground">Sell pressure</span>
                                    <div className="font-mono tabular-nums text-red-600 dark:text-red-400">
                                      {fmtUsd(row.sellPressure)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium text-foreground">Trades used</span>
                                    <div className="tabular-nums">{row.tradesUsed}</div>
                                  </div>
                                  <div>
                                    <span className="font-medium text-foreground">Unique buyers</span>
                                    <div className="tabular-nums">{row.uniqueBuyers}</div>
                                  </div>
                                  <div>
                                    <span className="font-medium text-foreground">Unique sellers</span>
                                    <div className="tabular-nums">{row.uniqueSellers}</div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </DataTable>
            ) : !running ? (
              <EmptyState
                description={
                  <>
                    No insider precision scores match your filter.{" "}
                    {result.tickersRequested === 0
                      ? "No active securities found — ingest securities first."
                      : "Ensure insider trades are synced and the scoring formula is seeded."}
                  </>
                }
              />
            ) : null}

            {/* Errors */}
            {hasErrors && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
                <p className="mb-2 text-sm font-medium text-destructive">Errors</p>
                <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-foreground">
                  {result.errors.map((err, i) => (
                    <li key={`${err.ticker}-${i}`}>
                      <span className="font-mono">{err.ticker}</span>: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ) : null}
            </>
          }
          settings={
            <AdminFormulaMarketingSection
              formulaKey={INSIDER_PRECISION_MARKETING_KEY}
              contextLabel="Insider precision"
            />
          }
        />
      </div>
    </div>
  );
}
