"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  listActiveEntitySecuritiesEmployeeOverview,
  batchResolveLinkedinCompanyUrls,
  batchFetchLinkedinHeadcount,
  type ActiveEntitySecurityEmployeeItem,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

function formatWhen(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function growthSummary(g: Record<string, string> | null | undefined): string {
  if (!g || typeof g !== "object") return "";
  return Object.entries(g)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

/** Lines like `AAPL=apple.com` or `AAPL apple.com` → security_id → domain, for *selected* ids only. */
function parseDomainOverridesBySecurityId(
  text: string,
  selectedIds: string[],
  idToTicker: Record<string, string>
): { overrides: Record<string, string>; unknownTickers: string[] } {
  const overrides: Record<string, string> = {};
  const unknownTickers: string[] = [];
  const tickerToId = new Map<string, string>();
  for (const id of selectedIds) {
    const t = idToTicker[id];
    if (t) tickerToId.set(t.toUpperCase(), id);
  }
  for (const line of text.split("\n")) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const eq = s.match(/^([A-Z0-9.]+)\s*=\s*(.+)$/i);
    if (eq) {
      const tick = eq[1].toUpperCase();
      const dom = eq[2].trim().toLowerCase().replace(/^www\./, "");
      const id = tickerToId.get(tick);
      if (id && dom) overrides[id] = dom;
      else if (!tickerToId.has(tick)) unknownTickers.push(tick);
      continue;
    }
    const sp = s.split(/\s+/);
    if (sp.length < 2) continue;
    const tick = (sp[0] ?? "").toUpperCase();
    const dom = sp.slice(1).join(" ").trim().toLowerCase().replace(/^www\./, "");
    const id = tickerToId.get(tick);
    if (id && dom) overrides[id] = dom;
    else if (!tickerToId.has(tick)) unknownTickers.push(tick);
  }
  return { overrides, unknownTickers: [...new Set(unknownTickers)] };
}

function HeadcountResultTable({ rows }: { rows: ActiveEntitySecurityEmployeeItem[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No rows to show. Select tickers above and use “Load results for selection”.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[960px] w-full text-sm">
        <thead className="border-b">
          <tr className="text-left text-xs text-muted-foreground">
            <th className="px-2 py-2">Ticker</th>
            <th className="px-2 py-2">Name</th>
            <th className="px-2 py-2">FMP #</th>
            <th className="px-2 py-2">Stored LinkedIn</th>
            <th className="px-2 py-2">Finder (s-r)</th>
            <th className="px-2 py-2">Riceman</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const r = row.linkedin_headcount_cache.riceman;
            const cf = row.linkedin_headcount_cache.company_finder;
            return (
              <tr key={row.security_id} className="border-b align-top">
                <td className="px-2 py-2 font-mono">{row.ticker}</td>
                <td className="max-w-[200px] px-2 py-2">{row.name}</td>
                <td className="px-2 py-2 whitespace-nowrap">
                  {row.fmp_headcount == null ? "—" : String(row.fmp_headcount)}
                </td>
                <td className="max-w-[200px] px-2 py-2 break-all text-xs">
                  {row.linkedin_company_url ? (
                    <a
                      className="text-primary underline underline-offset-2"
                      href={row.linkedin_company_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {row.linkedin_company_url.replace(/^https?:\/\//, "").slice(0, 48)}
                      {row.linkedin_company_url.length > 55 ? "…" : ""}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="max-w-[160px] px-2 py-2 text-xs">
                  {cf?.error ? (
                    <span className="text-destructive">{cf.error}</span>
                  ) : cf?.linkedin_url ? (
                    <div>
                      <div className="line-clamp-1 break-all text-muted-foreground">{cf.domain}</div>
                      <div className="text-muted-foreground">{formatWhen(cf.fetched_at)}</div>
                    </div>
                  ) : cf ? (
                    <div className="text-muted-foreground">{formatWhen(cf.fetched_at)}</div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="max-w-[240px] px-2 py-2">
                  {r?.error ? (
                    <span className="text-destructive text-xs">{r.error}</span>
                  ) : r ? (
                    <div className="space-y-0.5">
                      <div className="font-medium">
                        {r.employee_count != null ? r.employee_count : "—"}
                        {r.employee_range ? (
                          <span className="text-muted-foreground font-normal"> {r.employee_range}</span>
                        ) : null}
                      </div>
                      {r.total_job_openings != null ? (
                        <div className="text-xs text-muted-foreground">Open jobs: {r.total_job_openings}</div>
                      ) : null}
                      {growthSummary(r.headcount_growth) ? (
                        <div className="text-xs text-muted-foreground line-clamp-2">{growthSummary(r.headcount_growth)}</div>
                      ) : null}
                      <div className="text-xs text-muted-foreground">{formatWhen(r.fetched_at)}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminEmployeeHeadcountPage() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();

  const [q, setQ] = useState("");
  const [limit, setLimit] = useState("50");
  const [offset, setOffset] = useState(0);
  const [getCompanyInsights, setGetCompanyInsights] = useState(true);
  const [getTotalJobOpenings, setGetTotalJobOpenings] = useState(true);
  /** Used to map “domain override by ticker” lines to `securityId` (covers selections from other pages). */
  const [tickerBySecurityId, setTickerBySecurityId] = useState<Record<string, string>>({});
  /** Optional: one line per selected ticker, `TICKER=domain` or `TICKER domain` (for company-finder in step 2). */
  const [domainOverrideText, setDomainOverrideText] = useState("");

  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<ActiveEntitySecurityEmployeeItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [resultRows, setResultRows] = useState<ActiveEntitySecurityEmployeeItem[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [headcounting, setHeadcounting] = useState(false);

  const parsedLimit = useMemo(
    () => Math.max(1, Math.min(200, Number(limit) || 50)),
    [limit]
  );

  const selectedArray = useMemo(() => Array.from(selected), [selected]);
  const selectedOnPage = useMemo(
    () => candidates.filter((c) => selected.has(c.security_id)),
    [candidates, selected]
  );
  const allOnPageSelected =
    candidates.length > 0 && candidates.every((c) => selected.has(c.security_id));

  const loadCandidates = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await listActiveEntitySecuritiesEmployeeOverview(accessToken, {
        q: q.trim() || undefined,
        limit: parsedLimit,
        offset,
      });
      setCandidates(res.items);
      setTotalCount(res.total_count);
      setTickerBySecurityId((prev) => {
        const n = { ...prev };
        for (const c of res.items) n[c.security_id] = c.ticker;
        return n;
      });
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load list");
    } finally {
      setLoading(false);
    }
  }, [accessToken, offset, parsedLimit, q, showError]);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setOffset(0);
    setLoading(true);
    try {
      const res = await listActiveEntitySecuritiesEmployeeOverview(accessToken, {
        q: q.trim() || undefined,
        limit: parsedLimit,
        offset: 0,
      });
      setCandidates(res.items);
      setTotalCount(res.total_count);
      setTickerBySecurityId((prev) => {
        const n = { ...prev };
        for (const c of res.items) n[c.security_id] = c.ticker;
        return n;
      });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load list");
    } finally {
      setLoading(false);
    }
  }

  async function loadResultRowsForSelection() {
    if (!accessToken) return;
    if (selectedArray.length === 0) {
      setResultRows([]);
      return;
    }
    setLoadingResults(true);
    try {
      const res = await listActiveEntitySecuritiesEmployeeOverview(accessToken, {
        ids: selectedArray,
        limit: 200,
        offset: 0,
      });
      setResultRows(res.items);
      setTickerBySecurityId((prev) => {
        const n = { ...prev };
        for (const c of res.items) n[c.security_id] = c.ticker;
        return n;
      });
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load results");
    } finally {
      setLoadingResults(false);
    }
  }

  function toggleId(securityId: string, ticker: string) {
    setTickerBySecurityId((prev) => ({ ...prev, [securityId]: ticker }));
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(securityId)) n.delete(securityId);
      else n.add(securityId);
      return n;
    });
  }

  function selectAllOnPage() {
    setTickerBySecurityId((prev) => {
      const n = { ...prev };
      for (const c of candidates) n[c.security_id] = c.ticker;
      return n;
    });
    setSelected((prev) => {
      const n = new Set(prev);
      for (const c of candidates) n.add(c.security_id);
      return n;
    });
  }

  function clearPageSelection() {
    setSelected((prev) => {
      const n = new Set(prev);
      for (const c of candidates) n.delete(c.security_id);
      return n;
    });
  }

  async function onGetLinkedinUrls() {
    if (!accessToken) return;
    if (selectedArray.length === 0) {
      showError("Select at least one ticker.");
      return;
    }
    const { overrides, unknownTickers } = parseDomainOverridesBySecurityId(
      domainOverrideText,
      selectedArray,
      tickerBySecurityId
    );
    if (unknownTickers.length) {
      showError(
        `Domain overrides: not among selected (or unknown ticker): ${unknownTickers.join(", ")}. Check spelling.`
      );
      return;
    }
    setResolving(true);
    try {
      const { results } = await batchResolveLinkedinCompanyUrls(accessToken, {
        securityIds: selectedArray,
        ...(Object.keys(overrides).length ? { domainOverrideBySecurityId: overrides } : {}),
        market: "stocks",
        locale: "us",
      });
      const failed = results.filter((r) => !r.success);
      if (failed.length === results.length) {
        showError(failed[0]?.error ?? "All rows failed the LinkedIn URL step.");
      } else {
        if (failed.length) {
          showError(
            `Partial: ${results.length - failed.length} ok, ${failed.length} failed. First error: ${
              failed[0]?.error ?? "unknown"
            }`
          );
        } else {
          const skipped = results.filter((r) => r.success && r.skipped).length;
          showSuccess(
            skipped > 0
              ? `LinkedIn URLs: ${results.length} processed (${skipped} already had a URL, finder skipped).`
              : `LinkedIn URLs: ${results.length} processed.`
          );
        }
      }
      await loadResultRowsForSelection();
      await loadCandidates();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setResolving(false);
    }
  }

  async function onFetchHeadcounts() {
    if (!accessToken) return;
    if (selectedArray.length === 0) {
      showError("Select at least one ticker.");
      return;
    }
    setHeadcounting(true);
    try {
      const { results } = await batchFetchLinkedinHeadcount(accessToken, {
        securityIds: selectedArray,
        getCompanyInsights,
        getTotalJobOpenings,
        market: "stocks",
        locale: "us",
      });
      const failed = results.filter((r) => !r.success);
      if (failed.length === results.length) {
        showError(
          failed[0]?.error ??
            "Headcount step failed for all rows. Run “Get LinkedIn URLs” first so each row has a stored company URL."
        );
      } else {
        if (failed.length) {
          showError(
            `Headcount: ${results.length - failed.length} ok, ${failed.length} failed. First: ${
              failed[0]?.error ?? "unknown"
            }`
          );
        } else {
          showSuccess(`Headcount (Logical + Riceman): ${results.length} processed.`);
        }
      }
      await loadResultRowsForSelection();
      await loadCandidates();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setHeadcounting(false);
    }
  }

  const canPrev = offset > 0;
  const canNext = offset + candidates.length < totalCount;

  return (
    <div className="p-6 sm:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <p className="text-sm text-muted-foreground max-w-3xl">
          <strong>1</strong> — pick tickers. <strong>2</strong> — resolve LinkedIn URLs (optional per-ticker domain
          overrides) then fetch headcounts. <strong>3</strong> — table: FMP, finder, LinkedIn, Riceman (logical
          not shown). Universe:{" "}
          <code className="text-xs">active</code>, <code className="text-xs">entity_id</code>, US stocks.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>1. Select tickers</CardTitle>
            <CardDescription>
              Search, tick checkboxes, use pagination as needed. Selection stays when you change pages. Manual LinkedIn
              URLs: use the API or your DB; optional domain lines are in step 2.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSearch} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">Search ticker or name</label>
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

            {loading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Loading…
              </div>
            ) : candidates.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No matching securities.</p>
            ) : (
              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {totalCount} match(es) · {selectedOnPage.length} selected on this page · {selectedArray.length} total
                    selected
                  </span>
                  <Button type="button" size="sm" variant="secondary" onClick={selectAllOnPage}>
                    Select all on page
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={clearPageSelection}>
                    Clear page selection
                  </Button>
                </div>
                <div className="max-w-2xl rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="w-10 px-2 py-2">
                          <input
                            type="checkbox"
                            title="Select all on page"
                            checked={allOnPageSelected}
                            onChange={(e) => (e.target.checked ? selectAllOnPage() : clearPageSelection())}
                          />
                        </th>
                        <th className="w-24 px-2 py-2">Ticker</th>
                        <th className="px-2 py-2">Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map((row) => (
                        <tr key={row.security_id} className="border-b last:border-0">
                          <td className="px-2 py-1.5">
                            <input
                              type="checkbox"
                              checked={selected.has(row.security_id)}
                              onChange={() => toggleId(row.security_id, row.ticker)}
                            />
                          </td>
                          <td className="px-2 py-1.5 font-mono text-xs sm:text-sm">{row.ticker}</td>
                          <td className="px-2 py-1.5 text-muted-foreground line-clamp-1" title={row.name}>
                            {row.name}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Run Apify (two steps)</CardTitle>
            <CardDescription>
              Step A resolves and saves a public LinkedIn company URL when missing. Step B fetches headcounts (paid Apify
              usage) for each selected row that already has a URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5 max-w-xl">
              <label className="text-xs text-muted-foreground" htmlFor="domain-overrides">
                Optional: domain for company finder (per selected ticker only, one per line,{" "}
                <code className="text-[10px]">TICKER=domain</code> or <code className="text-[10px]">TICKER domain</code>)
              </label>
              <textarea
                id="domain-overrides"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[72px] w-full rounded-md border px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={'# e.g.\nAAPL=apple.com\nMSFT microsoft.com'}
                value={domainOverrideText}
                onChange={(e) => setDomainOverrideText(e.target.value)}
                spellCheck={false}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={resolving || selectedArray.length === 0}
                onClick={() => void onGetLinkedinUrls()}
              >
                {resolving ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="size-4" />
                    Resolving…
                  </span>
                ) : (
                  "Get LinkedIn URLs (s-r company finder)"
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={headcounting || selectedArray.length === 0}
                onClick={() => void onFetchHeadcounts()}
              >
                {headcounting ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="size-4" />
                    Fetching headcounts…
                  </span>
                ) : (
                  "Fetch headcounts (Logical + Riceman)"
                )}
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={getCompanyInsights}
                  onChange={(e) => setGetCompanyInsights(e.target.checked)}
                />
                Riceman: get_company_insights
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={getTotalJobOpenings}
                  onChange={(e) => setGetTotalJobOpenings(e.target.checked)}
                />
                Riceman: get_total_job_openings
              </label>
            </div>
            <div className="text-xs text-muted-foreground max-w-3xl space-y-1.5">
              <p>
                Requires <code className="rounded bg-muted px-0.5">APIFY_API_TOKEN</code> on the API. “Fetch
                headcount” only runs for rows that already have a stored LinkedIn company URL (run step A first, or use
                domain overrides if the finder is empty in the table).
              </p>
              <p>
                If a row shows <span className="text-destructive">Apify 403/400</span> in the results table, check the
                error text (Apify often includes a reason). 403/401 usually means token, plan, or actor access; 400 is
                often input validation—regional <code className="text-[10px]">*.linkedin.com</code> URLs are rewritten to{" "}
                <code className="text-[10px]">www.linkedin.com/company/…</code> on the server when you run step A or B.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Headcount results (FMP + finder + Riceman)</CardTitle>
            <CardDescription>
              FMP <code className="text-xs">total_employees</code>, s-r finder, stored LinkedIn URL, and Riceman. The
              logical scraper still runs in step 2; its output is not shown in this table.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={selectedArray.length === 0 || loadingResults}
                onClick={() => void loadResultRowsForSelection()}
              >
                {loadingResults ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="size-3" />
                    Loading…
                  </span>
                ) : (
                  "Load / refresh for selection"
                )}
              </Button>
              {selectedArray.length === 0 ? (
                <span className="text-sm text-muted-foreground">Select tickers in step 1 first.</span>
              ) : null}
            </div>
            {loadingResults ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Loading results…
              </div>
            ) : (
              <HeadcountResultTable rows={resultRows} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
