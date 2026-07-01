"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  convertOrganizationMultiFormulaScreenerToWatchlist,
  exportOrganizationMultiFormulaScreenerCsv,
  fetchMyOrganizations,
  listOrganizationClients,
  listOrganizationMultiFormulaScreener,
  type MultiFormulaScreenerListResult,
  type MultiFormulaScreenerParams,
  type MultiFormulaSortColumn,
  type OrganizationClient,
} from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui-kit/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import { Spinner } from "@/components/ui/spinner";

function toNum(v: string): number | undefined {
  const t = v.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function formatScore(v: number | null): string {
  if (v == null || Number.isNaN(v)) return "—";
  return String(Math.round(v * 1000) / 1000);
}

export function MultiFormulaScreener() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [clients, setClients] = useState<OrganizationClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MultiFormulaScreenerListResult | null>(null);
  const [busy, setBusy] = useState(false);

  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<MultiFormulaSortColumn>("ticker");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [minFc, setMinFc] = useState("");
  const [maxFc, setMaxFc] = useState("");
  const [minNe, setMinNe] = useState("");
  const [maxNe, setMaxNe] = useState("");

  const [watchlistName, setWatchlistName] = useState("");
  const [watchlistScopeClientId, setWatchlistScopeClientId] = useState("");

  const params: MultiFormulaScreenerParams = useMemo(
    () => ({
      q: q.trim() || undefined,
      limit: 100,
      offset: 0,
      sort_by: sortBy,
      sort_dir: sortDir,
      min_fundamental_constriction_score: toNum(minFc),
      max_fundamental_constriction_score: toNum(maxFc),
      min_net_exposure_score: toNum(minNe),
      max_net_exposure_score: toNum(maxNe),
    }),
    [maxFc, maxNe, minFc, minNe, q, sortBy, sortDir]
  );

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    fetchMyOrganizations(accessToken)
      .then(async (orgs) => {
        if (orgs.length === 0) throw new Error("No organization found");
        const orgId = orgs[0].id;
        setOrganizationId(orgId);
        const list = await listOrganizationClients(accessToken, orgId);
        setClients(list);
      })
      .catch((err) => showError(err instanceof Error ? err.message : "Failed to bootstrap page"))
      .finally(() => setLoading(false));
  }, [accessToken, showError]);

  async function reload(): Promise<void> {
    if (!accessToken || !organizationId) return;
    setBusy(true);
    try {
      const data = await listOrganizationMultiFormulaScreener(accessToken, organizationId, params);
      setRows(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load screener");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, organizationId, params]);

  async function onExport(): Promise<void> {
    if (!accessToken || !organizationId) return;
    try {
      const { blob, filename } = await exportOrganizationMultiFormulaScreenerCsv(
        accessToken,
        organizationId,
        params
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showSuccess("CSV exported");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to export");
    }
  }

  async function onConvert(): Promise<void> {
    if (!accessToken || !organizationId) return;
    const name = watchlistName.trim();
    if (!name) {
      showError("Watchlist name is required");
      return;
    }
    try {
      const res = await convertOrganizationMultiFormulaScreenerToWatchlist(
        accessToken,
        organizationId,
        { name, organization_client_id: watchlistScopeClientId || null },
        params
      );
      showSuccess(`Watchlist created with ${res.count_added} securities`);
      setWatchlistName("");
      setWatchlistScopeClientId("");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to convert to watchlist");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Multi formula screener
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Filter by multiple formula scores, sort by one active column, export CSV, or convert
            results to a new watchlist.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Combine formula constraints with AND behavior.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <FormLabel htmlFor="mfs-q">Search</FormLabel>
              <FormInput
                id="mfs-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ticker or name"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="mfs-min-fc">Min fundamental constriction</FormLabel>
              <FormInput
                id="mfs-min-fc"
                value={minFc}
                onChange={(e) => setMinFc(e.target.value)}
                placeholder="e.g. 65"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="mfs-max-fc">Max fundamental constriction</FormLabel>
              <FormInput
                id="mfs-max-fc"
                value={maxFc}
                onChange={(e) => setMaxFc(e.target.value)}
                placeholder="e.g. 95"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="mfs-min-ne">Min net exposure</FormLabel>
              <FormInput
                id="mfs-min-ne"
                value={minNe}
                onChange={(e) => setMinNe(e.target.value)}
                placeholder="e.g. -0.1"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="mfs-max-ne">Max net exposure</FormLabel>
              <FormInput
                id="mfs-max-ne"
                value={maxNe}
                onChange={(e) => setMaxNe(e.target.value)}
                placeholder="e.g. 0.8"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="mfs-sort-by">Sort by</FormLabel>
              <select
                id="mfs-sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as MultiFormulaSortColumn)}
                className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                <option value="ticker">Ticker</option>
                <option value="fundamental_constriction_score">Fundamental constriction</option>
                <option value="net_exposure_score">Net exposure</option>
                <option value="insider_precision_score">Insider precision</option>
                <option value="political_score">Political score</option>
              </select>
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="mfs-sort-dir">Sort direction</FormLabel>
              <select
                id="mfs-sort-dir"
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
                className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div className="flex items-end">
              <SecondaryButton type="button" onClick={() => void reload()}>
                Refresh
              </SecondaryButton>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Export filtered rows or convert to a new watchlist.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <FormLabel htmlFor="mfs-watchlist-name">Watchlist name</FormLabel>
              <FormInput
                id="mfs-watchlist-name"
                value={watchlistName}
                onChange={(e) => setWatchlistName(e.target.value)}
                placeholder="result set"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="mfs-watchlist-client">Scope client</FormLabel>
              <select
                id="mfs-watchlist-client"
                value={watchlistScopeClientId}
                onChange={(e) => setWatchlistScopeClientId(e.target.value)}
                className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                <option value="">Global (no client)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <PrimaryButton type="button" onClick={() => void onConvert()}>
                Convert to watchlist
              </PrimaryButton>
            </div>
            <div className="flex items-end">
              <SecondaryButton type="button" onClick={() => void onExport()}>
                Export CSV
              </SecondaryButton>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Result set</CardTitle>
            <CardDescription>
              {rows ? `${rows.total_count} matches` : "No rows loaded"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {busy && !rows ? (
              <div className="flex items-center justify-center py-10">
                <Spinner />
              </div>
            ) : (
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Fundamental constriction</TableHead>
                    <TableHead className="text-right">Net exposure</TableHead>
                    <TableHead className="text-right">Insider precision</TableHead>
                    <TableHead className="text-right">Political score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows?.items.map((row) => (
                    <TableRow key={row.security_id}>
                      <TableCell className="font-mono">
                        <Link
                          href={`/org/dashboard/stocks/${row.security_id}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {row.ticker}
                        </Link>
                      </TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatScore(row.fundamental_constriction_score)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatScore(row.net_exposure_score)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatScore(row.insider_precision_score)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatScore(row.political_score)}
                      </TableCell>
                    </TableRow>
                  )) ?? null}
                </TableBody>
              </DataTable>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
