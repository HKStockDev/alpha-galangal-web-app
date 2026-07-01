"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  calculateNetExposureScores,
  type NetExposureScoreCalculateResult,
} from "@/lib/api";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
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
import { readNetExposureDirectionWeights } from "@/lib/net-exposure-direction-weights";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import { AdminFormulaMarketingSection } from "@/components/dashboard/admin-formula-marketing-section";
import { FormulaMarketingPreviewButtons } from "@/components/dashboard/formula-marketing-preview-buttons";
import { FormulaPageResultsSettingsTabs } from "@/components/dashboard/formula-page-results-settings-tabs";
import { NET_EXPOSURE_MARKETING_KEY } from "@/lib/formula-marketing-keys";
import { ORG_DASHBOARD } from "@/lib/auth-routing";

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function AdminNetExposureScorePage() {
  const pathname = usePathname();
  const showSubheading = pathname?.startsWith(ORG_DASHBOARD) ?? false;
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<NetExposureScoreCalculateResult | null>(null);

  const [limit, setLimit] = useState("");
  const [tickersText, setTickersText] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");

  const buildBody = useCallback(() => {
    const tickers = tickersText
      .split(/[\s,]+/)
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean);
    return {
      tickers: tickers.length ? tickers : undefined,
      limit: parseOptionalNumber(limit),
      minScore: parseOptionalNumber(minScore),
      maxScore: parseOptionalNumber(maxScore),
      directionWeights: readNetExposureDirectionWeights(),
    };
  }, [limit, maxScore, minScore, tickersText]);

  const runCalculation = useCallback(
    async (toast = true) => {
      if (!accessToken) return;
      setRunning(true);
      try {
        const data = await calculateNetExposureScores(accessToken, buildBody());
        setResult(data);
        if (toast) {
          showSuccess(
            data.scoresWritten > 0
              ? `Updated ${data.scoresWritten} net exposure scores`
              : "Run finished; no scores written."
          );
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : "Run failed");
      } finally {
        setRunning(false);
      }
    },
    [accessToken, buildBody, showError, showSuccess]
  );

  useEffect(() => {
    if (!accessToken) return;
    void runCalculation(false);
  }, [accessToken, runCalculation]);

  async function onCustomRunSubmit(e: FormEvent) {
    e.preventDefault();
    setModalOpen(false);
    await runCalculation(true);
  }

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Net exposure
            </h1>
            {showSubheading ? (
              <p className="text-base text-muted-foreground">
                Run net exposure scoring. Direction weights are configured under{" "}
                <span className="font-medium text-foreground">Formulas → Net exposure</span>.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SecondaryButton
              type="button"
              size="sm"
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
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Custom run</DialogTitle>
              <DialogDescription>
                Optional filters. Weights from Formulas → Net exposure apply to this run.
              </DialogDescription>
            </DialogHeader>
            <form id="admin-ne-run-form" onSubmit={onCustomRunSubmit} className="space-y-4">
              <div className="space-y-2">
                <FormLabel htmlFor="admin-ne-limit">Max securities</FormLabel>
                <FormInput
                  id="admin-ne-limit"
                  inputMode="numeric"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="admin-ne-tickers">Tickers (optional)</FormLabel>
                <textarea
                  id="admin-ne-tickers"
                  rows={3}
                  className="flex min-h-20 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                  value={tickersText}
                  onChange={(e) => setTickersText(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <FormLabel htmlFor="admin-ne-min">Min score</FormLabel>
                  <FormInput
                    id="admin-ne-min"
                    inputMode="decimal"
                    value={minScore}
                    onChange={(e) => setMinScore(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel htmlFor="admin-ne-max">Max score</FormLabel>
                  <FormInput
                    id="admin-ne-max"
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
              <PrimaryButton
                type="submit"
                form="admin-ne-run-form"
                disabled={running || !accessToken}
              >
                {running ? "Running..." : "Run"}
              </PrimaryButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {result ? (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Last run</h2>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Tickers requested: {result.tickersRequested}</li>
              <li>Tickers scored: {result.tickersWithData}</li>
              <li>Scores written: {result.scoresWritten}</li>
            </ul>

            <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Ticker</TableHead>
                    <TableHead className="text-right">Net score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.scores.map((row) => (
                    <TableRow key={row.ticker}>
                      <TableCell>{row.rank ?? "—"}</TableCell>
                      <TableCell className="font-medium">{row.ticker}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.score}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>

            {result.errors.length > 0 ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-medium text-destructive mb-2">Errors</p>
                <ul className="text-xs text-foreground space-y-1 max-h-48 overflow-y-auto">
                  {result.errors.map((err, i) => (
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
