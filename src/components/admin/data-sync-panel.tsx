"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/context/toast-context";
import {
  fetchDataSyncStatus,
  syncEquityExposures,
  syncTaxonomyCycleScores,
  syncTaxonomyStructuralGrowthCagrScores,
  syncCommitteeMemberships,
  syncCongressMembers,
  syncFmpPoliticalFeedMissingSecurities,
  syncFmpPoliticalTrades,
  isTriggerDispatchResult,
  type DataSyncJobInfo,
  type DataSyncLastRun,
  type DataSyncStatus,
} from "@/lib/api";
import { SecondaryButton } from "@/components/ui-kit/buttons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatWhen(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatRelative(iso: string | undefined): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diffMs = Date.now() - then;
  const abs = Math.abs(diffMs);
  const minutes = Math.round(abs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function triggerRunUrl(projectId: string | undefined, runId: string): string {
  if (projectId) {
    return `https://cloud.trigger.dev/projects/${projectId}/runs/${runId}`;
  }
  return `https://cloud.trigger.dev`;
}

function triggerStartedMessage(r: {
  message: string;
  runId: string;
  taskId: string;
}): string {
  return `${r.message} Task \`${r.taskId}\`, run \`${r.runId}\`.`;
}

function StatusBadge({ last }: { last: DataSyncLastRun | null | undefined }) {
  if (!last) {
    return (
      <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Never run
      </span>
    );
  }
  if (last.running) {
    return (
      <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
        Running
      </span>
    );
  }
  if (last.ok) {
    return (
      <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        OK
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
      Issues
    </span>
  );
}

function SyncOverview({ status }: { status: DataSyncStatus }) {
  const jobList = Object.values(status.jobs);
  const stats = useMemo(() => {
    let ok = 0;
    let issues = 0;
    let running = 0;
    let never = 0;
    for (const job of jobList) {
      const last = job.lastRun;
      if (!last) never += 1;
      else if (last.running) running += 1;
      else if (last.ok) ok += 1;
      else issues += 1;
    }
    return { ok, issues, running, never, total: jobList.length };
  }, [jobList]);

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
        <p className="text-xs text-muted-foreground">Successful</p>
        <p className="text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
          {stats.ok}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / {stats.total}
          </span>
        </p>
      </div>
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
        <p className="text-xs text-muted-foreground">Running</p>
        <p className="text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-400">
          {stats.running}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
        <p className="text-xs text-muted-foreground">With issues</p>
        <p className="text-lg font-semibold tabular-nums text-destructive">
          {stats.issues}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
        <p className="text-xs text-muted-foreground">Never run</p>
        <p className="text-lg font-semibold tabular-nums text-muted-foreground">
          {stats.never}
        </p>
      </div>
    </div>
  );
}

function JobRow({
  title,
  detail,
  job,
  onRun,
  running,
  runLabel,
  schedulerMode,
  triggerProjectId,
}: {
  title: string;
  detail: string;
  job: DataSyncJobInfo;
  onRun: () => void;
  running: boolean;
  runLabel: string;
  schedulerMode?: DataSyncStatus["mode"];
  triggerProjectId?: string;
}) {
  const cron = job.cron ?? null;
  const last = job.lastRun;
  const cronHint =
    schedulerMode === "trigger.dev"
      ? cron
        ? `UTC schedule: ${cron}`
        : "No schedule"
      : cron
        ? `Nest cron: ${cron}`
        : "Disabled (set DATA_SYNC_CRON_* in API env)";

  return (
    <div className="grid gap-3 border-b border-border px-3 py-4 last:border-b-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] lg:items-start lg:gap-4">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <StatusBadge last={last} />
        </div>
        <p className="text-xs text-muted-foreground">{detail}</p>
        <p className="font-mono text-xs text-muted-foreground tabular-nums">
          {cronHint}
        </p>
      </div>

      <div className="min-w-0 space-y-1 text-xs text-muted-foreground">
        {last ? (
          <>
            <p>
              <span className="font-medium text-foreground">Last run:</span>{" "}
              {formatWhen(last.at)}{" "}
              <span className="text-muted-foreground">
                ({formatRelative(last.at)})
              </span>
            </p>
            {last.summary ? (
              <p className="wrap-break-word font-mono text-[11px] leading-relaxed">
                {last.summary}
              </p>
            ) : null}
            {last.source === "trigger.dev" && last.runId ? (
              <p>
                <a
                  href={triggerRunUrl(triggerProjectId, last.runId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  View run in Trigger.dev
                </a>
                {last.triggerStatus ? ` · ${last.triggerStatus}` : null}
              </p>
            ) : null}
          </>
        ) : (
          <p>No completed run found yet.</p>
        )}
        {job.triggerTaskId ? (
          <p className="font-mono text-[11px]">task: {job.triggerTaskId}</p>
        ) : null}
      </div>

      <SecondaryButton
        type="button"
        size="sm"
        className="shrink-0 justify-self-start lg:justify-self-end"
        disabled={running}
        onClick={onRun}
      >
        {running ? "Running…" : runLabel}
      </SecondaryButton>
    </div>
  );
}

export function DataSyncPanel({ accessToken }: { accessToken: string }) {
  const { showError, showSuccess } = useToast();
  const [status, setStatus] = useState<DataSyncStatus | null>(null);
  const [statusRefreshedAt, setStatusRefreshedAt] = useState<string | null>(
    null
  );
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [busy, setBusy] = useState<
    | "political"
    | "congress"
    | "committeeMemberships"
    | "fmpMissingSec"
    | "taxonomyCagrScores"
    | "taxonomyCycleScores"
    | "equityExposures"
    | null
  >(null);

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const s = await fetchDataSyncStatus(accessToken);
      setStatus(s);
      setStatusRefreshedAt(new Date().toISOString());
    } catch (e) {
      showError(e instanceof Error ? e.message : "Could not load sync status.");
    } finally {
      setLoadingStatus(false);
    }
  }, [accessToken, showError]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const runPolitical = useCallback(async () => {
    setBusy("political");
    try {
      const r = await syncFmpPoliticalTrades(accessToken);
      if (isTriggerDispatchResult(r)) {
        showSuccess(triggerStartedMessage(r));
      } else {
        const detail = [
          `Upserted ${r.inserted} row(s).`,
          ...r.syncNotes,
        ].join(" ");
        if (r.errors.length) {
          showError(`${r.errors.join("; ")} ${detail}`);
        } else {
          showSuccess(detail);
        }
      }
      await loadStatus();
    } catch (e) {
      showError(e instanceof Error ? e.message : "FMP political sync failed.");
    } finally {
      setBusy(null);
    }
  }, [accessToken, loadStatus, showError, showSuccess]);

  const runFmpMissingSecurities = useCallback(async () => {
    setBusy("fmpMissingSec");
    try {
      const r = await syncFmpPoliticalFeedMissingSecurities(accessToken, {
        delayMs: 250,
      });
      if (isTriggerDispatchResult(r)) {
        showSuccess(triggerStartedMessage(r));
      } else {
        const detail = [
          `Feeds: ${r.uniqueSymbolsInFeeds} unique symbols; missing in DB: ${r.missingInSecurities}.`,
          `Processed: ${r.toProcess} — synced ${r.synced}, ingest filtered ${r.filtered}, no FMP profile ${r.notFound}, other failures ${r.failed}.`,
          ...r.errors.slice(0, 5).map((e) => `Error sample: ${e}`),
        ].join(" ");
        if (r.failed > 0 || r.errors.length) {
          showError(detail);
        } else {
          showSuccess(detail);
        }
      }
      await loadStatus();
    } catch (e) {
      showError(
        e instanceof Error ? e.message : "FMP missing-securities sync failed."
      );
    } finally {
      setBusy(null);
    }
  }, [accessToken, loadStatus, showError, showSuccess]);

  const runCongress = useCallback(async () => {
    setBusy("congress");
    try {
      const r = await syncCongressMembers(accessToken);
      if (isTriggerDispatchResult(r)) {
        showSuccess(triggerStartedMessage(r));
      } else {
        showSuccess(
          `Congress ${r.congress}: synced ${r.synced}, errors ${r.errors}.`
        );
      }
      await loadStatus();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Congress sync failed.");
    } finally {
      setBusy(null);
    }
  }, [accessToken, loadStatus, showError, showSuccess]);

  const runCommitteeMemberships = useCallback(async () => {
    setBusy("committeeMemberships");
    try {
      const r = await syncCommitteeMemberships(accessToken);
      if (isTriggerDispatchResult(r)) {
        showSuccess(triggerStartedMessage(r));
      } else {
        const warn =
          r.warnings.length > 0 ? ` ${r.warnings.join(" ")}` : "";
        showSuccess(
          `Congress ${r.congress}: upserted ${r.upserted}, removed ${r.removed}.${warn}`
        );
      }
      await loadStatus();
    } catch (e) {
      showError(
        e instanceof Error ? e.message : "Committee membership sync failed."
      );
    } finally {
      setBusy(null);
    }
  }, [accessToken, loadStatus, showError, showSuccess]);

  const runTaxonomyStructuralGrowthCagrScores = useCallback(async () => {
    setBusy("taxonomyCagrScores");
    try {
      const r = await syncTaxonomyStructuralGrowthCagrScores(accessToken);
      if (isTriggerDispatchResult(r)) {
        showSuccess(triggerStartedMessage(r));
      } else {
        const detail = [
          `Scanned ${r.entitiesScanned} taxonomy entities.`,
          `Upserted ${r.horizonScoresUpserted} horizon score rows and ${r.compositesUpserted} composite rows.`,
          `Entities with full 3y/5y/10y horizons: ${r.entitiesWithAllHorizons}; missing any horizon: ${r.entitiesMissingAnyHorizon}.`,
        ].join(" ");
        if (r.errors.length > 0) {
          const sample = r.errors.slice(0, 5).join("; ");
          showError(`${detail} Error sample: ${sample}`);
        } else {
          showSuccess(detail);
        }
      }
      await loadStatus();
    } catch (e) {
      showError(
        e instanceof Error ? e.message : "Taxonomy CAGR score sync failed."
      );
    } finally {
      setBusy(null);
    }
  }, [accessToken, loadStatus, showError, showSuccess]);

  const runEquityExposures = useCallback(async () => {
    setBusy("equityExposures");
    try {
      const r = await syncEquityExposures(accessToken, { delayMs: 400 });
      if (isTriggerDispatchResult(r)) {
        showSuccess(triggerStartedMessage(r));
      } else {
        const detail = [
          `Securities in batch: ${r.total}.`,
          `Profiles processed: ${r.processed}; skipped (no FMP profile): ${r.skippedNoProfile}.`,
          `Exposure rows assigned/updated: ${r.exposuresAssignedTotal}.`,
        ].join(" ");
        if (r.errors.length > 0) {
          const sample = r.errors.slice(0, 5).join("; ");
          showError(`${detail} Error sample: ${sample}`);
        } else {
          showSuccess(detail);
        }
      }
      await loadStatus();
    } catch (e) {
      showError(
        e instanceof Error ? e.message : "Equity exposures sync failed."
      );
    } finally {
      setBusy(null);
    }
  }, [accessToken, loadStatus, showError, showSuccess]);

  const runTaxonomyCycleScores = useCallback(async () => {
    setBusy("taxonomyCycleScores");
    try {
      const r = await syncTaxonomyCycleScores(accessToken, { delayMs: 1500 });
      if (isTriggerDispatchResult(r)) {
        showSuccess(triggerStartedMessage(r));
      } else {
        const detail = [
          `Entities in scope: ${r.entitiesTotal}.`,
          `Fully processed: ${r.entitiesProcessed}; skipped (no active prompt): ${r.skippedNoPrompt}.`,
          `Gemini calls: ${r.llmCalls}; horizon rows upserted: ${r.horizonUpserts}.`,
        ].join(" ");
        if (r.errors.length > 0) {
          const sample = r.errors.slice(0, 5).join("; ");
          showError(`${detail} Error sample: ${sample}`);
        } else {
          showSuccess(detail);
        }
      }
      await loadStatus();
    } catch (e) {
      showError(
        e instanceof Error ? e.message : "Taxonomy cycle score sync failed."
      );
    } finally {
      setBusy(null);
    }
  }, [accessToken, loadStatus, showError, showSuccess]);

  if (!status && loadingStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data pipelines</CardTitle>
          <CardDescription>Loading sync status from API…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const jobs = status?.jobs;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base">Data pipelines</CardTitle>
          <CardDescription>
            {status?.mode === "trigger.dev" ? (
              <>
                Background jobs run on{" "}
                <strong>Trigger.dev</strong>. Last-run times are stored in the
                database when each task finishes, and can also be read from
                Trigger.dev if your API key matches the run environment.
              </>
            ) : (
              <>
                Jobs run in the Nest API process. Cron expressions come from{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  DATA_SYNC_CRON_*
                </code>
                .
              </>
            )}
          </CardDescription>
          {statusRefreshedAt ? (
            <p className="text-xs text-muted-foreground">
              Status refreshed {formatWhen(statusRefreshedAt)} (
              {formatRelative(statusRefreshedAt)})
            </p>
          ) : null}
          {status?.runHistory?.hint ? (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
              {status.runHistory.hint}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {status?.mode === "trigger.dev" && status.triggerProjectId ? (
            <SecondaryButton type="button" size="sm" asChild>
              <a
                href={`https://cloud.trigger.dev/projects/${status.triggerProjectId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Trigger.dev
              </a>
            </SecondaryButton>
          ) : null}
          <SecondaryButton
            type="button"
            size="sm"
            disabled={loadingStatus}
            onClick={() => void loadStatus()}
          >
            {loadingStatus ? "Refreshing…" : "Refresh status"}
          </SecondaryButton>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {status ? <SyncOverview status={status} /> : null}
        {jobs ? (
          <div className="overflow-hidden rounded-md border border-border">
            <div className="hidden border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] lg:gap-4">
              <span>Job</span>
              <span>Last run</span>
              <span className="text-right">Action</span>
            </div>
            <JobRow
              title="FMP → political_trades"
              detail="Senate/house disclosures matched to current members."
              job={jobs.fmpPoliticalTrades}
              onRun={runPolitical}
              running={busy === "political"}
              runLabel="Run now"
              schedulerMode={status?.mode}
              triggerProjectId={status?.triggerProjectId}
            />
            <JobRow
              title="FMP feeds → securities (gap fill)"
              detail="Symbols in political feeds missing from securities table."
              job={jobs.fmpPoliticalFeedMissingSecurities}
              onRun={runFmpMissingSecurities}
              running={busy === "fmpMissingSec"}
              runLabel="Run now"
              schedulerMode={status?.mode}
              triggerProjectId={status?.triggerProjectId}
            />
            <JobRow
              title="Congress.gov → members"
              detail="Current chamber members into politicians."
              job={jobs.congressMembers}
              onRun={runCongress}
              running={busy === "congress"}
              runLabel="Run now"
              schedulerMode={status?.mode}
              triggerProjectId={status?.triggerProjectId}
            />
            <JobRow
              title="Committee memberships"
              detail="YAML committee assignments (run committees sync first)."
              job={jobs.committeeMemberships}
              onRun={runCommitteeMemberships}
              running={busy === "committeeMemberships"}
              runLabel="Run now"
              schedulerMode={status?.mode}
              triggerProjectId={status?.triggerProjectId}
            />
            <JobRow
              title="Taxonomy structural growth CAGR"
              detail="Backfill sg_cagr scores from stored payloads."
              job={jobs.taxonomyStructuralGrowthCagrScores}
              onRun={runTaxonomyStructuralGrowthCagrScores}
              running={busy === "taxonomyCagrScores"}
              runLabel="Run now"
              schedulerMode={status?.mode}
              triggerProjectId={status?.triggerProjectId}
            />
            <JobRow
              title="Taxonomy cycle scores (LLM)"
              detail="Sector/industry cycle scores via Gemini (6m/12m/24m)."
              job={jobs.taxonomyCycleScores}
              onRun={runTaxonomyCycleScores}
              running={busy === "taxonomyCycleScores"}
              runLabel="Run now"
              schedulerMode={status?.mode}
              triggerProjectId={status?.triggerProjectId}
            />
            <JobRow
              title="Equity exposures (LLM)"
              detail="FMP profile + Gemini → security_exposures for all stocks."
              job={jobs.equityExposures}
              onRun={runEquityExposures}
              running={busy === "equityExposures"}
              runLabel="Run now"
              schedulerMode={status?.mode}
              triggerProjectId={status?.triggerProjectId}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No status available.</p>
        )}
      </CardContent>
    </Card>
  );
}
