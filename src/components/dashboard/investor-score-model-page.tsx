"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  calculateBuffettScores,
  calculateBurryScores,
  calculateDruckenmillerScores,
  calculateGrahamScores,
  calculateLynchScores,
  calculateWoodScores,
  getBurryScores,
  getBuffettScores,
  getDruckenmillerScores,
  getGrahamScores,
  getLynchScores,
  getWoodScores,
  type BuffettScoreCalculateResult,
  type BurryScoreCalculateResult,
  type DruckenmillerScoreCalculateResult,
  type GrahamScoreCalculateResult,
  type LynchScoreCalculateResult,
  type WoodScoreCalculateResult,
} from "@/lib/api";
import { INVESTOR_SCORE_FORMULA_KEY, INVESTOR_META, type InvestorScoreSlug } from "@/lib/investor-score-models";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
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
import { ORG_DASHBOARD, type DashboardBasePath } from "@/lib/auth-routing";
import { FormulaMarketingForm } from "./formula-marketing-form";
import { FormulaMarketingPreviewButtons } from "./formula-marketing-preview-buttons";
import { FormulaPageResultsSettingsTabs } from "./formula-page-results-settings-tabs";

type AnyInvestorResult =
  | BuffettScoreCalculateResult
  | BurryScoreCalculateResult
  | DruckenmillerScoreCalculateResult
  | WoodScoreCalculateResult
  | GrahamScoreCalculateResult
  | LynchScoreCalculateResult;

type SortColumn = "ticker" | "score" | "confidence";

function buildBody(
  limit: string,
  tickersText: string,
  minScore: string,
  maxScore: string
) {
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

export function InvestorScoreModelPage({
  model,
  basePath,
}: {
  model: InvestorScoreSlug;
  basePath: DashboardBasePath;
}) {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const [result, setResult] = useState<AnyInvestorResult | null>(null);
  const [running, setRunning] = useState(false);
  const [tableSort, setTableSort] = useState<{ column: SortColumn; dir: "asc" | "desc" }>({
    column: "score",
    dir: "desc",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [limit, setLimit] = useState("");
  const [tickersText, setTickersText] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");

  const meta = INVESTOR_META[model];
  const hubHref = `${basePath}/investors-scores`;

  const load = useCallback(
    async (opts?: { toast?: boolean }) => {
      if (!accessToken) return;
      const toast = opts?.toast !== false;
      setRunning(true);
      try {
        let data: AnyInvestorResult;
        if (model === "buffett") {
          data = await getBuffettScores(accessToken, {});
        } else if (model === "burry") {
          data = await getBurryScores(accessToken, {});
        } else if (model === "druckenmiller") {
          data = await getDruckenmillerScores(accessToken, {});
        } else if (model === "wood") {
          data = await getWoodScores(accessToken, {});
        } else if (model === "graham") {
          data = await getGrahamScores(accessToken, {});
        } else {
          data = await getLynchScores(accessToken, {});
        }
        setResult(data);
        if (toast) {
          showSuccess(`Loaded ${data.tickersWithData} ${meta.label} scores`);
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : "Load failed");
      } finally {
        setRunning(false);
      }
    },
    [accessToken, model, meta.label, showError, showSuccess]
  );

  const recalc = useCallback(async () => {
    if (!accessToken) return;
    setRunning(true);
    try {
      let data: AnyInvestorResult;
      if (model === "buffett") {
        data = await calculateBuffettScores(accessToken, {});
      } else if (model === "burry") {
        data = await calculateBurryScores(accessToken, {});
      } else if (model === "druckenmiller") {
        data = await calculateDruckenmillerScores(accessToken, {});
      } else if (model === "wood") {
        data = await calculateWoodScores(accessToken, {});
      } else if (model === "graham") {
        data = await calculateGrahamScores(accessToken, {});
      } else {
        data = await calculateLynchScores(accessToken, {});
      }
      setResult(data);
      showSuccess(
        data.scoresWritten > 0
          ? `Updated ${data.scoresWritten} ${meta.label} scores`
          : `${meta.label} run finished; no scores written.`
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }, [accessToken, model, meta.label, showError, showSuccess]);

  const onModalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setModalOpen(false);
    const body = buildBody(limit, tickersText, minScore, maxScore);
    setRunning(true);
    try {
      let data: AnyInvestorResult;
      if (model === "buffett") {
        data = await calculateBuffettScores(accessToken, body);
      } else if (model === "burry") {
        data = await calculateBurryScores(accessToken, body);
      } else if (model === "druckenmiller") {
        data = await calculateDruckenmillerScores(accessToken, body);
      } else if (model === "wood") {
        data = await calculateWoodScores(accessToken, body);
      } else if (model === "graham") {
        data = await calculateGrahamScores(accessToken, body);
      } else {
        data = await calculateLynchScores(accessToken, body);
      }
      setResult(data);
      showSuccess(
        data.scoresWritten > 0
          ? `Updated ${data.scoresWritten} ${meta.label} scores (${data.tickersWithData} tickers)`
          : `${meta.label} run finished; no scores written.`
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : "Run failed");
    } finally {
      setRunning(false);
    }
  };

  const openModal = () => {
    setLimit("");
    setTickersText("");
    setMinScore("");
    setMaxScore("");
    setModalOpen(true);
  };

  useEffect(() => {
    if (!accessToken) return;
    void load({ toast: false });
  }, [accessToken, load]);

  const sortedRows = useMemo(() => {
    if (!result?.scores) return [];
    const copy = [...result.scores];
    copy.sort((a, b) => {
      const dir = tableSort.dir === "asc" ? 1 : -1;
      if (tableSort.column === "ticker") return dir * a.ticker.localeCompare(b.ticker);
      if (tableSort.column === "confidence") return dir * (a.confidence - b.confidence);
      return dir * (a.score - b.score);
    });
    return copy;
  }, [result, tableSort]);

  function sortToggle(col: SortColumn) {
    setTableSort((prev) => ({
      column: col,
      dir: prev.column === col && prev.dir === "asc" ? "desc" : "asc",
    }));
  }

  function sortIndicator(col: SortColumn) {
    if (tableSort.column !== col) return null;
    return tableSort.dir === "asc" ? " ↑" : " ↓";
  }

  function scoreLabelClass(label: string) {
    if (label === "positive") return "text-emerald-600 dark:text-emerald-400";
    if (label === "neutral") return "text-muted-foreground";
    return "text-amber-600 dark:text-amber-400";
  }

  function renderIcon(size = 24) {
    if (meta.iconSrc) {
      return (
        <Image
          src={meta.iconSrc}
          alt={`${meta.label} icon`}
          width={size}
          height={size}
          className="rounded-full border border-border object-cover"
        />
      );
    }
    return (
      <span
        className="inline-flex items-center justify-center rounded-full border border-border bg-muted text-[10px] font-semibold text-foreground"
        style={{ width: size, height: size }}
        aria-hidden
      >
        {meta.shortLabel}
      </span>
    );
  }

  const errors = result?.errors ?? [];

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-sm text-muted-foreground">
              <Link
                href={hubHref}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                ← Investors scores
              </Link>
            </p>
            <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {renderIcon(40)}
              <span>{meta.label} scores</span>
            </h1>
            {basePath === ORG_DASHBOARD ? (
              <p className="text-base text-muted-foreground">
                LLM-generated scores for this model. Use Custom for filters; Recalc to run a full
                default pass for {meta.label} only.
              </p>
            ) : null}
          </div>
          <div className="flex w-full min-w-0 max-w-sm flex-col gap-2 self-end sm:max-w-none sm:items-end">
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 sm:max-w-xs">
              <SecondaryButton
                type="button"
                size="sm"
                disabled={!accessToken || running}
                onClick={openModal}
                className="h-7 w-full px-3 text-xs"
              >
                Custom
              </SecondaryButton>
              <PrimaryButton
                type="button"
                size="sm"
                disabled={!accessToken || running}
                onClick={() => void recalc()}
                className="h-7 w-full px-3 text-xs"
              >
                {running ? "Running…" : "Recalc"}
              </PrimaryButton>
            </div>
            <FormulaMarketingPreviewButtons className="w-full justify-end" />
          </div>
        </header>

        <FormulaPageResultsSettingsTabs
          results={
            <>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Custom {meta.label} run</DialogTitle>
              <DialogDescription>
                Optional max securities, ticker list, and score bounds. Leave empty for defaults.
              </DialogDescription>
            </DialogHeader>
            <form id="investor-modal-form" onSubmit={onModalSubmit} className="space-y-4">
              <div className="space-y-2">
                <FormLabel
                  htmlFor="inv-limit"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Max securities (optional)
                </FormLabel>
                <FormInput
                  id="inv-limit"
                  inputMode="numeric"
                  placeholder="e.g. 100"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <FormLabel
                  htmlFor="inv-tickers"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Tickers (optional)
                </FormLabel>
                <textarea
                  id="inv-tickers"
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
                  <FormLabel htmlFor="inv-min">Min score</FormLabel>
                  <FormInput
                    id="inv-min"
                    inputMode="decimal"
                    value={minScore}
                    onChange={(e) => setMinScore(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel htmlFor="inv-max">Max score</FormLabel>
                  <FormInput
                    id="inv-max"
                    inputMode="decimal"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                  />
                </div>
              </div>
            </form>
            <DialogFooter>
              <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" form="investor-modal-form" disabled={running || !accessToken}>
                {running ? "Running…" : `Run ${meta.label} scoring`}
              </PrimaryButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {!accessToken ? (
          <EmptyState compact description="Sign in to load scores." />
        ) : running && !result ? (
          <LoadingSkeleton variant="card" lines={3} className="p-8" />
        ) : null}

        {result ? (
          <section className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                {renderIcon(20)}
                {meta.label}: {result.tickersWithData} tickers
                {result.scoresWritten > 0 && (
                  <span className="text-xs">({result.scoresWritten} written last run)</span>
                )}
              </span>
            </p>

            {sortedRows.length > 0 ? (
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button type="button" onClick={() => sortToggle("ticker")}>
                        Ticker{sortIndicator("ticker")}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button type="button" onClick={() => sortToggle("score")}>
                        Score{sortIndicator("score")}
                      </button>
                    </TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead className="text-right">
                      <button type="button" onClick={() => sortToggle("confidence")}>
                        Confidence{sortIndicator("confidence")}
                      </button>
                    </TableHead>
                    <TableHead>Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRows.map((row, i) => (
                    <TableRow key={`${row.ticker}-${i}`}>
                      <TableCell className="font-medium">{row.ticker}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.score.toFixed(2)}</TableCell>
                      <TableCell
                        className={cn("font-medium capitalize", scoreLabelClass(row.label))}
                      >
                        {row.label}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {(row.confidence * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {row.summary || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            ) : (
              <EmptyState description="No scores found." />
            )}

            {errors.length > 0 ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-medium text-destructive mb-2">Errors</p>
                <ul className="max-h-56 space-y-1 overflow-y-auto text-xs text-foreground">
                  {errors.map((err, i) => (
                    <li key={`${err.ticker}-${i}`}>
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
            <FormulaMarketingForm
              accessToken={accessToken}
              formulaKey={INVESTOR_SCORE_FORMULA_KEY[model]}
              contextLabel={`${INVESTOR_META[model].label} score`}
            />
          }
        />
      </div>
    </div>
  );
}
