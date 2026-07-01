"use client";

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  calculateNetExposureScores,
  getNetExposureScores,
  type NetExposureScoreCalculateResult,
} from "@/lib/api";
import { FormulaExplanationSection } from "@/components/formulas/formula-explanation-section";
import { ScoreExplanationDetails } from "@/components/formulas/score-explanation-details";
import { stockEvidenceAnchorHref } from "@/lib/score-anchor-links";
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
import { cn } from "@/lib/utils";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui-kit/data-table";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import { AdminFormulaMarketingSection } from "@/components/dashboard/admin-formula-marketing-section";
import { FormulaMarketingPreviewButtons } from "@/components/dashboard/formula-marketing-preview-buttons";
import { FormulaPageResultsSettingsTabs } from "@/components/dashboard/formula-page-results-settings-tabs";
import { NET_EXPOSURE_MARKETING_KEY } from "@/lib/formula-marketing-keys";
import { ORG_DASHBOARD } from "@/lib/auth-routing";

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
  const tickers = tickersText
    .split(/[\s,]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const lim = limit.trim() ? parseInt(limit.trim(), 10) : undefined;
  const minS = minScore.trim() ? parseFloat(minScore.trim()) : undefined;
  const maxS = maxScore.trim() ? parseFloat(maxScore.trim()) : undefined;
  const body: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  } = {};
  if (tickers.length) body.tickers = tickers;
  if (lim != null && lim > 0) body.limit = lim;
  if (minS != null && !Number.isNaN(minS)) body.minScore = minS;
  if (maxS != null && !Number.isNaN(maxS)) body.maxScore = maxS;
  return body;
}

type ScoreRow = NetExposureScoreCalculateResult["scores"][number];
type SortColumn = "ticker" | "score";

function SortIconAsc({ className }: { className?: string }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path
        d="m18 15-6-6-6 6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SortIconDesc({ className }: { className?: string }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SortIconBoth({ className }: { className?: string }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path
        d="m8 10 4-4 4 4M8 14l4 4 4-4"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SortableTableHead({
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
  onSort: (col: SortColumn) => void;
  align?: "left" | "right";
}) {
  const active = activeColumn === column;
  return (
    <TableHead
      scope="col"
      aria-sort={
        active ? (direction === "asc" ? "ascending" : "descending") : "none"
      }
      className={cn(
        "whitespace-normal align-middle",
        align === "right" && "text-right",
        column === "ticker" && "min-w-26",
        column === "score" && "min-w-22"
      )}
    >
      <GhostButton
        type="button"
        size="sm"
        onClick={() => onSort(column)}
        aria-label={`Sort by ${label}`}
        className={cn(
          "-mx-1 h-9 gap-1.5 px-2 font-medium text-foreground hover:text-foreground",
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

export default function NetExposureScorePage() {
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
  const [result, setResult] = useState<NetExposureScoreCalculateResult | null>(null);
  const [tableSort, setTableSort] = useState<{
    column: SortColumn | null;
    dir: "asc" | "desc";
  }>({ column: "score", dir: "asc" });
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  const sortedRows = useMemo(() => {
    const rows = result?.scores;
    if (!rows?.length) return [];
    if (!tableSort.column) return rows;
    const copy: ScoreRow[] = [...rows];
    copy.sort((a, b) => {
      if (tableSort.column === "ticker") {
        const c = a.ticker.localeCompare(b.ticker, undefined, { sensitivity: "base" });
        return tableSort.dir === "asc" ? c : -c;
      }
      const c = a.score - b.score;
      return tableSort.dir === "asc" ? c : -c;
    });
    return copy;
  }, [result?.scores, tableSort.column, tableSort.dir]);

  function handleTableSort(column: SortColumn) {
    setTableSort((prev) => {
      if (prev.column !== column) {
        return { column, dir: column === "score" ? "asc" : "asc" };
      }
      return { column, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  }

  const loadScores = useCallback(
    async (
      body: {
        tickers?: string[];
        limit?: number;
        minScore?: number;
        maxScore?: number;
      },
      { recalculate = false, toast = true } = {}
    ) => {
      if (!accessToken) return;
      setRunning(true);
      try {
        let data: NetExposureScoreCalculateResult;
        if (recalculate) {
          const calc = await calculateNetExposureScores(accessToken, body);
          data = await getNetExposureScores(accessToken, body);
          data = { ...data, scoresWritten: calc.scoresWritten, errors: calc.errors };
        } else {
          data = await getNetExposureScores(accessToken, body);
        }
        setResult(data);
        if (toast) {
          if (recalculate) {
            showSuccess(
              data.scoresWritten > 0
                ? `Updated ${data.scoresWritten} net exposure scores (${data.tickersWithData} tickers)`
                : "Run finished; no scores written. Check errors below."
            );
          } else if (data.tickersWithData > 0) {
            showSuccess(`Loaded ${data.tickersWithData} net exposure scores`);
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

  useEffect(() => {
    if (!accessToken) return;
    void loadScores({}, { recalculate: false, toast: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when token is ready
  }, [accessToken]);

  async function onModalSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    const body = buildBody(limit, tickersText, minScore, maxScore);
    setModalOpen(false);
    await loadScores(body, { recalculate: true, toast: true });
  }

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Net exposure
            </h1>
            {showSubheading ? (
              <p className="text-base text-muted-foreground">
                Theme exposure signal from <span className="font-mono">security_exposures</span>{" "}
                and <span className="font-mono">exposures.polarity</span> (Formulas.md). Scores load
                automatically; use custom run to filter by tickers, limit, or net score range.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:self-start">
            <SecondaryButton
              type="button"
              size="sm"
              className="shrink-0"
              disabled={!accessToken || running}
              onClick={() => setModalOpen(true)}
            >
              Custom run
            </SecondaryButton>
            <FormulaMarketingPreviewButtons />
          </div>
        </header>

        <FormulaPageResultsSettingsTabs
          results={
            <>
        <FormulaExplanationSection formulaKey={NET_EXPOSURE_MARKETING_KEY} />

        <section className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm">
          <h2 className="text-sm font-medium text-foreground">Net score range filter</h2>
          <p className="text-xs text-muted-foreground">
            Applied on the next run (inclusive). Leave empty for no bound.
          </p>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5">
              <FormLabel
                htmlFor="ne-min"
                className="text-xs font-medium text-muted-foreground"
              >
                Min net score
              </FormLabel>
              <FormInput
                id="ne-min"
                inputMode="decimal"
                placeholder="e.g. -0.5"
                className="w-32"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <FormLabel
                htmlFor="ne-max"
                className="text-xs font-medium text-muted-foreground"
              >
                Max net score
              </FormLabel>
              <FormInput
                id="ne-max"
                inputMode="decimal"
                placeholder="e.g. 0.5"
                className="w-32"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
              />
            </div>
            <PrimaryButton
              type="button"
              size="sm"
              disabled={!accessToken || running}
              onClick={() =>
                void loadScores(buildBody(limit, tickersText, minScore, maxScore), {
                  recalculate: true,
                  toast: true,
                })
              }
            >
              Apply & recalculate
            </PrimaryButton>
          </div>
        </section>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Custom run</DialogTitle>
              <DialogDescription>
                Optional max securities, ticker list, and net score bounds. Leave empty for
                defaults.
              </DialogDescription>
            </DialogHeader>
            <form id="ne-modal-form" onSubmit={onModalSubmit} className="space-y-4">
              <div className="space-y-2">
                <FormLabel
                  htmlFor="ne-modal-limit"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Max securities (optional)
                </FormLabel>
                <FormInput
                  id="ne-modal-limit"
                  inputMode="numeric"
                  placeholder="e.g. 50 — empty = cap 500"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <FormLabel
                  htmlFor="ne-modal-tickers"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Tickers (optional)
                </FormLabel>
                <textarea
                  id="ne-modal-tickers"
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
                  <FormLabel htmlFor="ne-modal-min">Min net score</FormLabel>
                  <FormInput
                    id="ne-modal-min"
                    inputMode="decimal"
                    value={minScore}
                    onChange={(e) => setMinScore(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel htmlFor="ne-modal-max">Max net score</FormLabel>
                  <FormInput
                    id="ne-modal-max"
                    inputMode="decimal"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Direction weights: beneficiary 1.0, supplier 0.7, customer 0.5, dependent 0.5.
                Tailwind sums polarity +1; headwind sums polarity −1 (positive magnitude); net sums
                polarity × term.
              </p>
            </form>
            <DialogFooter>
              <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" form="ne-modal-form" disabled={running || !accessToken}>
                {running ? "Running…" : "Calculate scores"}
              </PrimaryButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {!accessToken ? (
          <EmptyState compact description="Sign in to load scores." />
        ) : running && !result ? (
          <LoadingSkeleton variant="card" lines={3} className="p-8" />
        ) : null}

        {running && result ? (
          <LoadingSkeleton variant="inline" lines={1} className="max-w-[220px]" />
        ) : null}

        {result ? (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Last run</h2>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Tickers requested: {result.tickersRequested}</li>
              <li>Tickers scored: {result.tickersWithData}</li>
              <li>Scores written: {result.scoresWritten}</li>
            </ul>

            {result.scores.length > 0 ? (
              <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10" />
                      <TableHead>Rank</TableHead>
                      <SortableTableHead
                        column="ticker"
                        label="Ticker"
                        activeColumn={tableSort.column}
                        direction={tableSort.dir}
                        onSort={handleTableSort}
                      />
                      <SortableTableHead
                        column="score"
                        label="Net score"
                        activeColumn={tableSort.column}
                        direction={tableSort.dir}
                        onSort={handleTableSort}
                        align="right"
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRows.map((row) => {
                      const isExpanded = expandedTicker === row.ticker;
                      return (
                        <React.Fragment key={row.ticker}>
                          <TableRow>
                            <TableCell>
                              <GhostButton
                                type="button"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() =>
                                  setExpandedTicker(isExpanded ? null : row.ticker)
                                }
                              >
                                {isExpanded ? "−" : "+"}
                              </GhostButton>
                            </TableCell>
                            <TableCell>{row.rank ?? "—"}</TableCell>
                            <TableCell className="font-medium">{row.ticker}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.score}
                            </TableCell>
                          </TableRow>
                          {isExpanded ? (
                            <TableRow>
                              <TableCell colSpan={4} className="bg-muted/30">
                                <ScoreExplanationDetails
                                  formulaKey={NET_EXPOSURE_MARKETING_KEY}
                                  explanation={{
                                    tailwind: row.tailwind,
                                    headwind: row.headwind,
                                    rowsUsed: row.rowsUsed,
                                    noPolarityRows: row.noPolarityRows,
                                  }}
                                  showAnchorLink
                                  evidenceHref={stockEvidenceAnchorHref(
                                    row.security_id,
                                    NET_EXPOSURE_MARKETING_KEY,
                                  )}
                                />
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </DataTable>
            ) : null}

            {result.errors.length > 0 ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-medium text-destructive mb-2">Errors</p>
                <ul className="text-xs text-foreground space-y-1 max-h-48 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <li key={`${err.ticker}-err-${i}`}>
                      <span className="font-mono">{err.ticker}</span>: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}
            </>
          }
          settings={
            <AdminFormulaMarketingSection
              formulaKey={NET_EXPOSURE_MARKETING_KEY}
              contextLabel="Net exposure"
            />
          }
        />
      </div>
    </div>
  );
}
