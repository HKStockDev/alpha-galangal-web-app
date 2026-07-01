"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  listActiveEntitySecuritiesJobCounts,
  syncIndeedCompanyJobPosts,
  batchFetchLinkedinHeadcount,
  type ActiveEntityJobCountsItem,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

export default function AdminJobCountsPage() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();

  const [q, setQ] = useState("");
  const [limit, setLimit] = useState("50");
  const [offset, setOffset] = useState(0);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ActiveEntityJobCountsItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [syncingIndeed, setSyncingIndeed] = useState(false);
  const [refreshingRiceman, setRefreshingRiceman] = useState(false);

  const parsedLimit = useMemo(
    () => Math.max(1, Math.min(200, Number(limit) || 50)),
    [limit]
  );

  const selectedArray = useMemo(() => Array.from(selected), [selected]);
  const selectedRows = useMemo(
    () => rows.filter((r) => selected.has(r.security_id)),
    [rows, selected]
  );
  const allOnPageSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.security_id));

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await listActiveEntitySecuritiesJobCounts(accessToken, {
        q: q.trim() || undefined,
        limit: parsedLimit,
        offset,
      });
      setRows(res.items);
      setTotalCount(res.total_count);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load job counts");
    } finally {
      setLoading(false);
    }
  }, [accessToken, offset, parsedLimit, q, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    setOffset(0);
    await load();
  }

  function toggleId(securityId: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(securityId)) n.delete(securityId);
      else n.add(securityId);
      return n;
    });
  }

  function selectAllOnPage() {
    setSelected((prev) => {
      const n = new Set(prev);
      for (const r of rows) n.add(r.security_id);
      return n;
    });
  }

  function clearPageSelection() {
    setSelected((prev) => {
      const n = new Set(prev);
      for (const r of rows) n.delete(r.security_id);
      return n;
    });
  }

  async function onSyncIndeedSelected() {
    if (!accessToken) return;
    if (selectedRows.length === 0) {
      showError("Select at least one company.");
      return;
    }
    setSyncingIndeed(true);
    let ok = 0;
    let failed = 0;
    let firstError = "";
    try {
      for (const row of selectedRows) {
        try {
          await syncIndeedCompanyJobPosts(accessToken, {
            companyName: row.name,
            country: "US",
            maxItems: 100,
            sort: "date",
          });
          ok += 1;
        } catch (err) {
          failed += 1;
          if (!firstError) {
            firstError = err instanceof Error ? err.message : String(err);
          }
        }
      }
      if (failed === selectedRows.length) {
        showError(firstError || "Indeed sync failed for all selected rows.");
      } else if (failed > 0) {
        showError(`Indeed sync: ${ok} ok, ${failed} failed. First error: ${firstError}`);
      } else {
        showSuccess(`Indeed (kaix) sync triggered for ${ok} compan${ok === 1 ? "y" : "ies"}.`);
      }
      await load();
    } finally {
      setSyncingIndeed(false);
    }
  }

  async function onRefreshRicemanSelected() {
    if (!accessToken) return;
    if (selectedArray.length === 0) {
      showError("Select at least one company.");
      return;
    }
    setRefreshingRiceman(true);
    try {
      const { results } = await batchFetchLinkedinHeadcount(accessToken, {
        securityIds: selectedArray,
        getCompanyInsights: true,
        getTotalJobOpenings: true,
        market: "stocks",
        locale: "us",
      });
      const failed = results.filter((r) => !r.success);
      if (failed.length === results.length) {
        showError(
          failed[0]?.error ??
            "Riceman refresh failed for all rows. Make sure each row has a stored LinkedIn company URL (use the Employee headcount page to resolve)."
        );
      } else if (failed.length > 0) {
        showError(
          `Riceman: ${results.length - failed.length} ok, ${failed.length} failed. First: ${
            failed[0]?.error ?? "unknown"
          }`
        );
      } else {
        showSuccess(`Riceman refresh: ${results.length} compan${results.length === 1 ? "y" : "ies"} updated.`);
      }
      await load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Riceman refresh failed");
    } finally {
      setRefreshingRiceman(false);
    }
  }

  const canPrev = offset > 0;
  const canNext = offset + rows.length < totalCount;

  return (
    <div className="p-6 sm:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Job counts by company
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Per-company stored job-post counts for active securities (
            <code className="text-xs">securities.active = true</code>,{" "}
            <code className="text-xs">entity_id IS NOT NULL</code>). Indeed counts are aggregated
            from the <code className="text-xs">job_posts</code> table (kaix actor); LinkedIn{" "}
            <em>total job openings</em> come from the cached Riceman actor result on each security.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
            <CardDescription>Search by ticker or company name.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSearch} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">
                  Search ticker or name
                </label>
                <Input
                  placeholder="e.g. MSFT or Microsoft"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="w-24">
                <label className="mb-1 block text-xs text-muted-foreground">Page size</label>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading}>
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Results ({totalCount})</CardTitle>
                <CardDescription>
                  {selectedArray.length} selected · page {Math.floor(offset / parsedLimit) + 1}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={syncingIndeed || selectedRows.length === 0}
                  onClick={() => void onSyncIndeedSelected()}
                >
                  {syncingIndeed ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner className="size-3" />
                      Syncing Indeed…
                    </span>
                  ) : (
                    "Sync Indeed (kaix) for selected"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={refreshingRiceman || selectedArray.length === 0}
                  onClick={() => void onRefreshRicemanSelected()}
                >
                  {refreshingRiceman ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner className="size-3" />
                      Refreshing Riceman…
                    </span>
                  ) : (
                    "Refresh Riceman for selected"
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Loading job counts…
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching securities.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="w-10 px-2 py-2">
                        <input
                          type="checkbox"
                          title="Select all on page"
                          checked={allOnPageSelected}
                          onChange={(e) =>
                            e.target.checked ? selectAllOnPage() : clearPageSelection()
                          }
                        />
                      </th>
                      <th className="px-2 py-2">Ticker</th>
                      <th className="px-2 py-2">Name</th>
                      <th className="px-2 py-2 text-right">FMP #</th>
                      <th className="px-2 py-2 text-right">Indeed total</th>
                      <th className="px-2 py-2 text-right">Indeed active</th>
                      <th className="px-2 py-2">Indeed last seen</th>
                      <th className="px-2 py-2 text-right">Riceman jobs</th>
                      <th className="px-2 py-2 text-right">Riceman emp.</th>
                      <th className="px-2 py-2">Riceman fetched</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.security_id} className="border-b align-top">
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={selected.has(row.security_id)}
                            onChange={() => toggleId(row.security_id)}
                          />
                        </td>
                        <td className="px-2 py-2 font-mono text-xs sm:text-sm">{row.ticker}</td>
                        <td
                          className="max-w-[280px] px-2 py-2 text-muted-foreground"
                          title={row.name}
                        >
                          {row.name}
                        </td>
                        <td className="px-2 py-2 text-right whitespace-nowrap">
                          {formatNumber(row.fmp_headcount)}
                        </td>
                        <td className="px-2 py-2 text-right whitespace-nowrap">
                          {formatNumber(row.indeed_total_count)}
                        </td>
                        <td className="px-2 py-2 text-right whitespace-nowrap">
                          {formatNumber(row.indeed_active_count)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-muted-foreground">
                          {formatDateTime(row.indeed_last_seen_at)}
                        </td>
                        <td className="px-2 py-2 text-right whitespace-nowrap">
                          {formatNumber(row.riceman_total_job_openings)}
                        </td>
                        <td className="px-2 py-2 text-right whitespace-nowrap">
                          {formatNumber(row.riceman_employee_count)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-muted-foreground">
                          {formatDateTime(row.riceman_fetched_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading || !canPrev}
                onClick={() => setOffset((o) => Math.max(0, o - parsedLimit))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading || !canNext}
                onClick={() => setOffset((o) => o + parsedLimit)}
              >
                Next
              </Button>
              <span className="text-xs text-muted-foreground">
                Showing {rows.length === 0 ? 0 : offset + 1}–{offset + rows.length} of {totalCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
