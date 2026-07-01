"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  fetchMyOrganizations,
  getOrganizationEquityTagFilter,
  listOrganizationEquities,
  listOrganizationEquityTagOptions,
  patchOrganizationEquityTagFilter,
  type MyOrganization,
  type OrgEquityCycleHorizon,
  type OrgEquityRow,
  type OrgEquityTagOption,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui-kit/buttons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";

const LIST_LIMIT = 100;

type CycleVal = -1 | 0 | 1;

const CYCLE_VAL_LABEL: Record<CycleVal, string> = {
  [-1]: "Down",
  [0]: "Neutral",
  [1]: "Up",
};

function cycleSelectionsText(set: Set<CycleVal>): string {
  if (set.size === 0) return "";
  return [...set]
    .sort((a, b) => a - b)
    .map((v) => CYCLE_VAL_LABEL[v])
    .join(", ");
}

function cycleHorizonLabel(h: OrgEquityCycleHorizon): string {
  if (h === "6m") return "6 months";
  if (h === "12m") return "12 months";
  return "24 months";
}

function equityWord(n: number): string {
  return n === 1 ? "equity" : "equities";
}

function formatCap(v: number | null): string {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toLocaleString();
}

function cycleDirectionLabel(v: number | null | undefined): string {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Math.round(Number(v)) as CycleVal;
  if (n === -1 || n === 0 || n === 1) return CYCLE_VAL_LABEL[n];
  return "—";
}

export function OrgEquitiesScreener() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();

  const [orgs, setOrgs] = useState<MyOrganization[]>([]);
  const [orgLoading, setOrgLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [equitiesLoading, setEquitiesLoading] = useState(false);
  const [equityRows, setEquityRows] = useState<OrgEquityRow[]>([]);
  const [equitiesHasMore, setEquitiesHasMore] = useState(false);
  const [totalMatchCount, setTotalMatchCount] = useState<number | null>(null);
  /** Set when the list API fails so we do not confuse with “zero matches”. */
  const [equitiesLoadError, setEquitiesLoadError] = useState<string | null>(null);

  /** Same filters as the primary list, but taxonomy cycle filter + columns always use the 24m horizon. */
  const [equities24mLoading, setEquities24mLoading] = useState(false);
  const [equityRows24m, setEquityRows24m] = useState<OrgEquityRow[]>([]);
  const [equities24mHasMore, setEquities24mHasMore] = useState(false);
  const [totalMatchCount24m, setTotalMatchCount24m] = useState<number | null>(null);
  const [equities24mLoadError, setEquities24mLoadError] = useState<string | null>(null);

  const [tagOptions, setTagOptions] = useState<OrgEquityTagOption[]>([]);
  const [filterSummary, setFilterSummary] = useState<{
    tag_ids: string[];
    tags: OrgEquityTagOption[];
  } | null>(null);
  const [draftTagIds, setDraftTagIds] = useState<Set<string>>(new Set());
  const [savingFilter, setSavingFilter] = useState(false);

  const [cycleHorizon, setCycleHorizon] = useState<OrgEquityCycleHorizon>("24m");
  const [sectorCycles, setSectorCycles] = useState<Set<CycleVal>>(new Set());
  const [industryCycles, setIndustryCycles] = useState<Set<CycleVal>>(new Set());
  const [subIndustryCycles, setSubIndustryCycles] = useState<Set<CycleVal>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!accessToken) return;
    setOrgLoading(true);
    fetchMyOrganizations(accessToken)
      .then((rows) => {
        setOrgs(rows);
        if (rows.length > 0) {
          setOrganizationId(rows[0].id);
          setIsOrgAdmin(rows[0].role === "org_admin");
        }
      })
      .catch((e) => showError(e instanceof Error ? e.message : "Failed to load organization"))
      .finally(() => setOrgLoading(false));
  }, [accessToken, showError]);

  const loadEquitiesPage = useCallback(
    async (orgId: string, q: string, offset: number, append: boolean) => {
      if (!accessToken) return;
      if (!append) {
        setTotalMatchCount(null);
        setEquityRows([]);
        setEquitiesHasMore(false);
        setEquitiesLoadError(null);
      }
      setEquitiesLoading(true);
      try {
        const data = await listOrganizationEquities(accessToken, orgId, {
          q: q || undefined,
          limit: LIST_LIMIT,
          offset,
          cycle_horizon: cycleHorizon,
          sector_cycles: sectorCycles.size ? [...sectorCycles] : undefined,
          industry_cycles: industryCycles.size ? [...industryCycles] : undefined,
          sub_industry_cycles: subIndustryCycles.size ? [...subIndustryCycles] : undefined,
        });
        setEquityRows((prev) => (append ? [...prev, ...data.items] : data.items));
        setEquitiesHasMore(data.has_more);
        setTotalMatchCount(
          typeof data.total_count === "number" && !Number.isNaN(data.total_count)
            ? data.total_count
            : 0
        );
        setEquitiesLoadError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load equities";
        showError(msg);
        if (!append) {
          setEquityRows([]);
          setEquitiesHasMore(false);
          setTotalMatchCount(null);
          setEquitiesLoadError(msg);
        }
      } finally {
        setEquitiesLoading(false);
      }
    },
    [
      accessToken,
      showError,
      cycleHorizon,
      sectorCycles,
      industryCycles,
      subIndustryCycles,
    ]
  );

  const loadEquities24mPage = useCallback(
    async (orgId: string, q: string, offset: number, append: boolean) => {
      if (!accessToken) return;
      if (!append) {
        setTotalMatchCount24m(null);
        setEquityRows24m([]);
        setEquities24mHasMore(false);
        setEquities24mLoadError(null);
      }
      setEquities24mLoading(true);
      try {
        const data = await listOrganizationEquities(accessToken, orgId, {
          q: q || undefined,
          limit: LIST_LIMIT,
          offset,
          cycle_horizon: "24m",
          sector_cycles: sectorCycles.size ? [...sectorCycles] : undefined,
          industry_cycles: industryCycles.size ? [...industryCycles] : undefined,
          sub_industry_cycles: subIndustryCycles.size ? [...subIndustryCycles] : undefined,
        });
        setEquityRows24m((prev) => (append ? [...prev, ...data.items] : data.items));
        setEquities24mHasMore(data.has_more);
        setTotalMatchCount24m(
          typeof data.total_count === "number" && !Number.isNaN(data.total_count)
            ? data.total_count
            : 0
        );
        setEquities24mLoadError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load 24m equities";
        showError(msg);
        if (!append) {
          setEquityRows24m([]);
          setEquities24mHasMore(false);
          setTotalMatchCount24m(null);
          setEquities24mLoadError(msg);
        }
      } finally {
        setEquities24mLoading(false);
      }
    },
    [accessToken, showError, sectorCycles, industryCycles, subIndustryCycles]
  );

  const loadFilterAndTags = useCallback(
    async (orgId: string) => {
      if (!accessToken) return;
      try {
        const [pickable, applied] = await Promise.all([
          listOrganizationEquityTagOptions(accessToken, orgId),
          getOrganizationEquityTagFilter(accessToken, orgId),
        ]);
        setTagOptions(pickable);
        setFilterSummary(applied);
        setDraftTagIds(new Set(applied.tag_ids));
      } catch (e) {
        showError(e instanceof Error ? e.message : "Failed to load tag settings");
        setFilterSummary({ tag_ids: [], tags: [] });
        setDraftTagIds(new Set());
      }
    },
    [accessToken, showError]
  );

  useEffect(() => {
    if (!organizationId || !accessToken) return;
    void loadEquitiesPage(organizationId, debouncedQ, 0, false);
  }, [organizationId, accessToken, debouncedQ, loadEquitiesPage]);

  useEffect(() => {
    if (!organizationId || !accessToken) return;
    void loadEquities24mPage(organizationId, debouncedQ, 0, false);
  }, [organizationId, accessToken, debouncedQ, loadEquities24mPage]);

  useEffect(() => {
    if (!organizationId || !accessToken) return;
    void loadFilterAndTags(organizationId);
  }, [organizationId, accessToken, loadFilterAndTags]);

  const tagsByGroup = useMemo(() => {
    const m = new Map<string, OrgEquityTagOption[]>();
    for (const t of tagOptions) {
      const g = t.group || "Other";
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(t);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [tagOptions]);

  function toggleDraftTag(id: string, on: boolean) {
    setDraftTagIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function saveFilter() {
    if (!accessToken || !organizationId) return;
    setSavingFilter(true);
    try {
      const updated = await patchOrganizationEquityTagFilter(
        accessToken,
        organizationId,
        [...draftTagIds]
      );
      setFilterSummary(updated);
      setDraftTagIds(new Set(updated.tag_ids));
      showSuccess("Equity tag filter saved");
      await loadEquitiesPage(organizationId, debouncedQ, 0, false);
      await loadEquities24mPage(organizationId, debouncedQ, 0, false);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Could not save filter");
    } finally {
      setSavingFilter(false);
    }
  }

  function resetDraftToApplied() {
    if (!filterSummary) return;
    setDraftTagIds(new Set(filterSummary.tag_ids));
  }

  const draftDirty =
    filterSummary != null &&
    [...filterSummary.tag_ids].sort().join("\0") !== [...draftTagIds].sort().join("\0");

  function toggleCycleSelection(
    setter: Dispatch<SetStateAction<Set<CycleVal>>>,
    v: CycleVal
  ) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }

  const cycleFilterActive =
    sectorCycles.size > 0 || industryCycles.size > 0 || subIndustryCycles.size > 0;

  const tagRestrictionActive =
    filterSummary != null && filterSummary.tag_ids.length > 0;

  if (orgLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!organizationId) {
    return (
      <p className="text-sm text-muted-foreground">
        No organization is linked to this account. Complete onboarding or ask an admin to invite you.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Screener</h1>
        <p className="text-sm text-muted-foreground">
          Browse active US equities. Filter by taxonomy cycle (sector, industry, sub-industry) and
          optional tag restrictions. Organization admins can save the tag filter for everyone in the
          org.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle className="text-base">Tag filter</CardTitle>
            {filterSummary != null ? (
              <p className="text-sm tabular-nums text-muted-foreground sm:text-right">
                <span className="font-medium text-foreground">{tagOptions.length}</span>{" "}
                {tagOptions.length === 1 ? "tag" : "tags"} available
                {filterSummary.tag_ids.length > 0 ? (
                  <>
                    {" · "}
                    <span className="font-medium text-foreground">{filterSummary.tag_ids.length}</span>{" "}
                    {filterSummary.tag_ids.length === 1 ? "tag" : "tags"} in the saved filter
                  </>
                ) : null}
                {isOrgAdmin && draftDirty ? (
                  <>
                    {" · "}
                    <span className="font-medium text-foreground">{draftTagIds.size}</span> selected
                    (unsaved)
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
          <CardDescription>
            {filterSummary == null ? (
              <>Loading filter…</>
            ) : filterSummary.tag_ids.length > 0 ? (
              <>
                Active restriction: show only equities tagged with{" "}
                {filterSummary.tags.map((t) => (
                  <Badge key={t.tag_id} variant="secondary" className="mr-1 mt-1">
                    {t.name}
                  </Badge>
                ))}
              </>
            ) : (
              <>No tag restriction — all active US equities match the search below.</>
            )}
          </CardDescription>
        </CardHeader>
        {isOrgAdmin ? (
          <CardContent className="space-y-4 border-t border-border/80 pt-4">
            <p className="text-sm text-muted-foreground">
              Select one or more tags. A security is included if it has{" "}
              <span className="font-medium text-foreground">any</span> of them. Clear all checkboxes
              and save to show the full universe again.
            </p>
            <div className="max-h-64 space-y-4 overflow-y-auto rounded-md border border-border/80 p-3">
              {tagsByGroup.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags available for this organization.</p>
              ) : (
                tagsByGroup.map(([group, tags]) => (
                  <div key={group}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group}
                    </p>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {tags.map((t) => (
                        <li key={t.tag_id} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            id={`tag-${t.tag_id}`}
                            checked={draftTagIds.has(t.tag_id)}
                            onChange={(e) => toggleDraftTag(t.tag_id, e.target.checked)}
                            className="mt-1 size-4 shrink-0 rounded border-input"
                          />
                          <label htmlFor={`tag-${t.tag_id}`} className="cursor-pointer text-sm leading-snug">
                            <span className="font-medium text-foreground">{t.name}</span>
                            <span className="ml-1 font-mono text-xs text-muted-foreground">{t.slug}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <PrimaryButton type="button" disabled={savingFilter || !draftDirty} onClick={() => void saveFilter()}>
                {savingFilter ? "Saving…" : "Save filter"}
              </PrimaryButton>
              <SecondaryButton
                type="button"
                disabled={savingFilter || !draftDirty}
                onClick={resetDraftToApplied}
              >
                Revert
              </SecondaryButton>
            </div>
          </CardContent>
        ) : (
          <CardContent className="border-t border-border/80 pt-4">
            <p className="text-sm text-muted-foreground">
              Only organization admins can change which tags restrict this list.
            </p>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Taxonomy cycle filter</CardTitle>
          <CardDescription>
            Match equities whose sector, industry, and sub-industry cycle scores (from platform data)
            are in the selected states. Leave a row empty to skip that level. Default horizon is 24
            months.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 border-t border-border/80 pt-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Horizon</p>
            <div className="flex flex-wrap items-center gap-2">
              <SecondaryButton
                type="button"
                size="sm"
                className={cycleHorizon === "24m" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                onClick={() => setCycleHorizon("24m")}
              >
                24M
              </SecondaryButton>
              <span className="text-xs text-muted-foreground">(default)</span>
            </div>
            <details className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                Shorter horizons (less prominent)
              </summary>
              <div className="mt-3 flex flex-wrap gap-2">
                <SecondaryButton
                  type="button"
                  size="sm"
                  className={cn("text-xs", cycleHorizon === "12m" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "")}
                  onClick={() => setCycleHorizon("12m")}
                >
                  12M
                </SecondaryButton>
                <SecondaryButton
                  type="button"
                  size="sm"
                  className={cn("text-xs", cycleHorizon === "6m" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "")}
                  onClick={() => setCycleHorizon("6m")}
                >
                  6M
                </SecondaryButton>
              </div>
            </details>
          </div>

          {(
            [
              ["Sector", sectorCycles, setSectorCycles] as const,
              ["Industry", industryCycles, setIndustryCycles] as const,
              ["Sub-industry", subIndustryCycles, setSubIndustryCycles] as const,
            ] as const
          ).map(([label, setVal, setSetter]) => (
            <div key={label} className="space-y-2">
              <p className="text-xs font-medium text-foreground">{label}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                {(
                  [
                    ["Down", -1],
                    ["Neutral", 0],
                    ["Up", 1],
                  ] as const
                ).map(([name, val]) => (
                  <label key={name} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={setVal.has(val)}
                      onChange={() => toggleCycleSelection(setSetter, val)}
                      className="size-4 shrink-0 rounded border-input"
                    />
                    <span>{name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {cycleFilterActive ? (
            <div className="space-y-2 rounded-md border border-border/80 bg-muted/30 px-3 py-2 text-xs">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Matching</span> equities whose cycle
                scores at the <span className="font-medium text-foreground">{cycleHorizonLabel(cycleHorizon)}</span>{" "}
                horizon are:
              </p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                {sectorCycles.size > 0 ? (
                  <li>
                    <span className="font-medium text-foreground">Sector</span>:{" "}
                    {cycleSelectionsText(sectorCycles)}
                  </li>
                ) : (
                  <li className="text-muted-foreground/90">
                    <span className="font-medium text-foreground">Sector</span>: any (not filtered)
                  </li>
                )}
                {industryCycles.size > 0 ? (
                  <li>
                    <span className="font-medium text-foreground">Industry</span>:{" "}
                    {cycleSelectionsText(industryCycles)}
                  </li>
                ) : (
                  <li className="text-muted-foreground/90">
                    <span className="font-medium text-foreground">Industry</span>: any (not filtered)
                  </li>
                )}
                {subIndustryCycles.size > 0 ? (
                  <li>
                    <span className="font-medium text-foreground">Sub-industry</span>:{" "}
                    {cycleSelectionsText(subIndustryCycles)}
                  </li>
                ) : (
                  <li className="text-muted-foreground/90">
                    <span className="font-medium text-foreground">Sub-industry</span>: any (not filtered)
                  </li>
                )}
              </ul>
              {equitiesLoading ? (
                <p className="text-muted-foreground" role="status">
                  Loading match count…
                </p>
              ) : totalMatchCount !== null ? (
                <p className="tabular-nums text-foreground" role="status">
                  <span className="font-semibold">{totalMatchCount.toLocaleString()}</span>{" "}
                  {equityWord(totalMatchCount)} match (with current tag filter and search).
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>No taxonomy cycle filter — every equity passes the cycle step (subject to tag filter and search).</p>
              {!equitiesLoading && totalMatchCount !== null ? (
                <p className="tabular-nums text-foreground" role="status">
                  <span className="font-semibold">{totalMatchCount.toLocaleString()}</span>{" "}
                  {equityWord(totalMatchCount)} in scope right now.
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2 sm:max-w-sm sm:flex-1">
            <FormLabel htmlFor="screener-search">Search ticker or name</FormLabel>
            <FormInput
              id="screener-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. AAPL or Apple"
              autoComplete="off"
            />
          </div>
          {orgs.length > 1 ? (
            <div className="space-y-2 sm:w-56">
              <FormLabel htmlFor="screener-org">Organization</FormLabel>
              <select
                id="screener-org"
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm",
                  "shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                )}
                value={organizationId}
                onChange={(e) => {
                  const id = e.target.value;
                  setOrganizationId(id);
                  const row = orgs.find((o) => o.id === id);
                  setIsOrgAdmin(row?.role === "org_admin");
                  setSearchInput("");
                  setDebouncedQ("");
                  setCycleHorizon("24m");
                  setSectorCycles(new Set());
                  setIndustryCycles(new Set());
                  setSubIndustryCycles(new Set());
                }}
              >
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {totalMatchCount !== null && !equitiesLoading ? (
          <div
            className="flex flex-col gap-1 rounded-md border border-border/80 bg-muted/30 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
            role="status"
          >
            <p className="text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">
                {totalMatchCount.toLocaleString()}
              </span>{" "}
              {equityWord(totalMatchCount)} match your current search, tag filter, and taxonomy cycle
              filter
            </p>
            {equityRows.length > 0 ? (
              <p className="tabular-nums text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {equityRows.length.toLocaleString()}
                </span>
                {totalMatchCount > equityRows.length ? (
                  <>
                    {" "}
                    of <span className="font-medium text-foreground">{totalMatchCount.toLocaleString()}</span>
                  </>
                ) : null}
                {equitiesHasMore ? (
                  <span className="block sm:ml-1 sm:inline"> — more rows below</span>
                ) : totalMatchCount > 0 && equityRows.length >= totalMatchCount ? (
                  <span className="block sm:ml-1 sm:inline"> — all matches loaded</span>
                ) : null}
              </p>
            ) : null}
          </div>
        ) : null}

        {equitiesLoading && totalMatchCount === null && !equitiesLoadError ? (
          <p className="text-sm text-muted-foreground" role="status">
            Loading results…
          </p>
        ) : null}

        {equitiesLoadError && !equitiesLoading ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            Could not load equities: {equitiesLoadError}
          </p>
        ) : null}

        <div className="rounded-md border border-border">
          {equitiesLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : !equityRows.length ? (
            <div className="space-y-2 px-4 py-10 text-center text-sm text-muted-foreground">
              {equitiesLoadError ? (
                <p>Fix the issue above, then refresh the page or change search.</p>
              ) : totalMatchCount === 0 ? (
                <>
                  <p className="font-medium text-foreground">Zero matches in the database for this query.</p>
                  <p>
                    {tagRestrictionActive ? (
                      <>
                        The org&apos;s saved tag filter is on, but no active US stock has{" "}
                        <span className="font-medium text-foreground">any</span> of those tags. Ask an
                        admin to clear or change the tag filter, or tag securities accordingly.
                      </>
                    ) : cycleFilterActive ? (
                      <>
                        Taxonomy cycle filters require matching cycle scores and classifications. Try
                        clearing sector / industry / sub-industry selections, or widen them.
                      </>
                    ) : (
                      <>
                        No rows match search (if any). If this is a fresh environment, seed{" "}
                        <span className="font-mono text-foreground">securities</span> (active US stocks)
                        or check that the API can reach your database.
                      </>
                    )}
                  </p>
                </>
              ) : (
                <p>No equities match this search and filters.</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Exchange</TableHead>
                  <TableHead className="text-right">Market cap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equityRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono font-medium">
                      <Link href={`/org/dashboard/stocks/${row.id}`} className="underline-offset-2 hover:underline">
                        {row.ticker}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">{row.primary_exchange ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCap(row.market_cap)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {equitiesHasMore ? (
          <SecondaryButton
            type="button"
            disabled={equitiesLoading}
            onClick={() => {
              if (!organizationId) return;
              void loadEquitiesPage(organizationId, debouncedQ, equityRows.length, true);
            }}
          >
            Load more
          </SecondaryButton>
        ) : null}

        <div className="space-y-4 border-t border-border/80 pt-10">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              24-month horizon: taxonomy and stocks
            </h2>
            <p className="text-sm text-muted-foreground">
              Same search, tag filter, and cycle checkboxes as above, but matching and displayed
              scores use the <span className="font-medium text-foreground">24-month</span> horizon
              only. Stock columns are ticker, name, exchange, and market cap; taxonomy columns are
              sector, industry, and sub-industry titles with cycle direction (down / neutral / up).
            </p>
            <p className="text-sm text-muted-foreground">
              If the primary list above uses <span className="font-medium text-foreground">6m or 12m</span>,
              it filters on those horizons; this block always filters on{" "}
              <span className="font-medium text-foreground">24m</span>. A name can pass at 12m and fail
              at 24m, so this table can be empty while the primary list is not. Clear the sector /
              industry / sub-industry checkboxes to widen the 24m set.
            </p>
          </div>

          {totalMatchCount24m !== null &&
          !equities24mLoading &&
          totalMatchCount24m === 0 &&
          totalMatchCount !== null &&
          totalMatchCount > 0 ? (
            <p
              className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground"
              role="status"
            >
              Zero matches at <span className="font-medium">24m</span> with your current filters, but
              the primary list has matches — usually because cycle filters use different horizons
              (primary: {cycleHorizonLabel(cycleHorizon)} scores; this table: 24-month scores). Try
              clearing taxonomy cycle checkboxes or compare when the primary horizon is also 24
              months.
            </p>
          ) : null}

          {totalMatchCount24m !== null && !equities24mLoading ? (
            <p className="text-sm tabular-nums text-muted-foreground" role="status">
              <span className="font-semibold text-foreground">
                {totalMatchCount24m.toLocaleString()}
              </span>{" "}
              {equityWord(totalMatchCount24m)} at 24m
              {equityRows24m.length > 0 && totalMatchCount24m > equityRows24m.length ? (
                <>
                  {" "}
                  (showing {equityRows24m.length.toLocaleString()} loaded)
                </>
              ) : null}
            </p>
          ) : null}

          {equities24mLoading && totalMatchCount24m === null && !equities24mLoadError ? (
            <p className="text-sm text-muted-foreground" role="status">
              Loading 24-month view…
            </p>
          ) : null}

          {equities24mLoadError && !equities24mLoading ? (
            <p
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              Could not load 24-month list: {equities24mLoadError}
            </p>
          ) : null}

          <div className="overflow-x-auto rounded-md border border-border">
            {equities24mLoading && totalMatchCount24m === null && !equities24mLoadError ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : !equityRows24m.length ? (
              <div className="space-y-2 px-4 py-10 text-center text-sm text-muted-foreground">
                {equities24mLoadError ? (
                  <p>Fix the issue above, then refresh or change search.</p>
                ) : totalMatchCount24m === 0 ? (
                  <p>No rows match at the 24-month horizon for this query (see note above if the primary list has rows).</p>
                ) : totalMatchCount24m !== null ? (
                  <p>
                    Count says {totalMatchCount24m.toLocaleString()} {equityWord(totalMatchCount24m)}{" "}
                    but no rows are in memory — try refreshing the page or check the API response.
                  </p>
                ) : (
                  <p>Preparing count for the 24-month view…</p>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Exchange</TableHead>
                    <TableHead className="text-right">Market cap</TableHead>
                    <TableHead className="min-w-[120px]">Sector</TableHead>
                    <TableHead className="min-w-[120px]">Industry</TableHead>
                    <TableHead className="min-w-[120px]">Sub-industry</TableHead>
                    <TableHead>Sector cycle</TableHead>
                    <TableHead>Industry cycle</TableHead>
                    <TableHead>Sub-ind. cycle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equityRows24m.map((row) => (
                    <TableRow key={`24m-${row.id}`}>
                      <TableCell className="font-mono font-medium">
                        <Link href={`/org/dashboard/stocks/${row.id}`} className="underline-offset-2 hover:underline">
                          {row.ticker}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{row.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.primary_exchange ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatCap(row.market_cap)}</TableCell>
                      <TableCell className="max-w-[160px] truncate text-muted-foreground">
                        {row.sector_title?.trim() ? row.sector_title : "—"}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-muted-foreground">
                        {row.industry_title?.trim() ? row.industry_title : "—"}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-muted-foreground">
                        {row.sub_industry_title?.trim() ? row.sub_industry_title : "—"}
                      </TableCell>
                      <TableCell>{cycleDirectionLabel(row.sector_cycle)}</TableCell>
                      <TableCell>{cycleDirectionLabel(row.industry_cycle)}</TableCell>
                      <TableCell>{cycleDirectionLabel(row.sub_industry_cycle)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {equities24mHasMore ? (
            <SecondaryButton
              type="button"
              variant="secondary"
              disabled={equities24mLoading}
              onClick={() => {
                if (!organizationId) return;
                void loadEquities24mPage(organizationId, debouncedQ, equityRows24m.length, true);
              }}
            >
              Load more (24m)
            </SecondaryButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
