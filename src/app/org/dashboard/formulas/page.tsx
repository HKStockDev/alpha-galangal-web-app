"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  fetchMyOrganizations,
  listOrganizationFormulaMarketing,
  type FormulaMarketingRow,
  type FormulaVisibility,
  type MyOrganization,
} from "@/lib/api";
import { ORG_DASHBOARD } from "@/lib/auth-routing";
import {
  marketingCategoryLabel,
  orgDashboardHrefForFormulaKey,
} from "@/lib/org-formula-dashboard-links";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { SecondaryButton } from "@/components/ui-kit/buttons";
import { FormLabel } from "@/components/ui-kit/forms";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const VISIBILITY_LABELS: Record<string, string> = {
  organization: "Organization",
  private: "Private",
  public: "Public",
};

const ALL_ORGS_VALUE = "__all__";

function visibilityLabel(v: string): string {
  return VISIBILITY_LABELS[v] ?? v;
}

function isFormulaVisibility(v: string): v is FormulaVisibility {
  return v === "organization" || v === "private" || v === "public";
}

function mergeFormulaRows(batches: FormulaMarketingRow[][]): FormulaMarketingRow[] {
  const byId = new Map<string, FormulaMarketingRow>();
  for (const batch of batches) {
    for (const row of batch) {
      byId.set(row.id, row);
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function formatReleaseDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function OrgFormulasHomePage() {
  const { accessToken } = useAuth();
  const { showError } = useToast();

  const [orgs, setOrgs] = useState<MyOrganization[]>([]);
  /** When multiple orgs: `ALL_ORGS_VALUE` = merged catalog; else a single organization id. */
  const [orgScope, setOrgScope] = useState<string>(ALL_ORGS_VALUE);
  const [rows, setRows] = useState<FormulaMarketingRow[]>([]);
  const [bootLoading, setBootLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);

  const loadFormulas = useCallback(async () => {
    if (!accessToken || orgs.length === 0) return;
    setListLoading(true);
    try {
      if (orgs.length === 1) {
        const data = await listOrganizationFormulaMarketing(accessToken, orgs[0].id);
        setRows(data);
        return;
      }
      if (orgScope !== ALL_ORGS_VALUE) {
        const data = await listOrganizationFormulaMarketing(accessToken, orgScope);
        setRows(data);
        return;
      }
      const batches = await Promise.all(
        orgs.map((o) => listOrganizationFormulaMarketing(accessToken, o.id))
      );
      setRows(mergeFormulaRows(batches));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load formulas");
      setRows([]);
    } finally {
      setListLoading(false);
    }
  }, [accessToken, orgs, orgScope, showError]);

  useEffect(() => {
    if (!accessToken) return;
    setBootLoading(true);
    fetchMyOrganizations(accessToken)
      .then((list) => {
        if (list.length === 0) {
          showError("No organization found for this account");
          setOrgs([]);
          return;
        }
        setOrgs(list);
        setOrgScope(list.length === 1 ? list[0].id : ALL_ORGS_VALUE);
      })
      .catch((err) =>
        showError(err instanceof Error ? err.message : "Failed to resolve organization")
      )
      .finally(() => setBootLoading(false));
  }, [accessToken, showError]);

  useEffect(() => {
    if (orgs.length === 0) return;
    if (
      orgScope !== ALL_ORGS_VALUE &&
      !orgs.some((o) => o.id === orgScope)
    ) {
      setOrgScope(orgs.length === 1 ? orgs[0].id : ALL_ORGS_VALUE);
      return;
    }
    void loadFormulas();
  }, [loadFormulas, orgs, orgScope]);

  const orgNameById = (id: string | null | undefined) => {
    if (!id) return "Shared";
    return orgs.find((o) => o.id === id)?.name ?? id.slice(0, 8);
  };

  if (bootLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (orgs.length === 0) {
    return (
      <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
        <p className="text-sm text-muted-foreground">No organization available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-muted-foreground">
              <LayoutGrid className="size-5 shrink-0" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wide">Formulas</span>
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Your formulas
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Cards show how each formula is presented (hero, description, visibility). Open the
              matching dashboard tool to run scores and explore results.
            </p>
          </div>
          {orgs.length > 1 ? (
            <div className="w-full shrink-0 space-y-2 sm:max-w-xs">
              <FormLabel htmlFor="formulas-org-scope">Organization</FormLabel>
              <select
                id="formulas-org-scope"
                value={orgScope}
                onChange={(e) => setOrgScope(e.target.value)}
                className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value={ALL_ORGS_VALUE}>All organizations (combined)</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {listLoading ? (
          <LoadingSkeleton variant="card" lines={6} className="max-w-4xl" />
        ) : rows.length === 0 ? (
          <EmptyState
            description="No formulas are linked to this organization yet. An administrator can seed formulas and marketing metadata."
            className="max-w-lg"
          />
        ) : (
          <ul className="grid list-none gap-6 p-0 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => {
              const href = orgDashboardHrefForFormulaKey(row.key);
              const category = marketingCategoryLabel(row.marketing_settings);
              const description =
                typeof row.description === "string" && row.description.trim()
                  ? row.description.trim()
                  : null;
              const vis = row.visibility ?? "";
              const visVariant = isFormulaVisibility(vis)
                ? vis === "public"
                  ? "default"
                  : vis === "private"
                    ? "secondary"
                    : "outline"
                : "outline";
              const releaseLabel = formatReleaseDate(row.next_release_at);
              const showOrgBadge = orgs.length > 1 && orgScope === ALL_ORGS_VALUE;
              const displayFormula =
                typeof row.display_formula === "string" && row.display_formula.trim()
                  ? row.display_formula.trim()
                  : null;

              return (
                <li key={row.id}>
                  <Card className="flex h-full flex-col overflow-hidden border-border transition-shadow hover:shadow-md">
                    <div className="relative aspect-video w-full shrink-0 bg-muted">
                      {row.hero_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- Supabase storage URLs
                        <img
                          src={row.hero_image_url}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-linear-to-br from-muted to-muted/60">
                          <LayoutGrid
                            className="size-12 text-muted-foreground/40"
                            aria-hidden
                          />
                        </div>
                      )}
                    </div>
                    <CardHeader className="space-y-2 pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={visVariant}>{visibilityLabel(vis)}</Badge>
                        {category ? (
                          <Badge variant="outline" className="font-normal">
                            {category}
                          </Badge>
                        ) : null}
                        {showOrgBadge ? (
                          <Badge variant="secondary" className="max-w-[200px] truncate font-normal">
                            {orgNameById(row.organization_id)}
                          </Badge>
                        ) : null}
                      </div>
                      <CardTitle className="text-lg leading-snug">{row.name}</CardTitle>
                      {description ? (
                        <CardDescription className="line-clamp-4 text-sm leading-relaxed">
                          {description}
                        </CardDescription>
                      ) : (
                        <CardDescription className="italic text-muted-foreground">
                          No description yet.
                        </CardDescription>
                      )}
                      {displayFormula ? (
                        <p className="line-clamp-2 font-mono text-xs leading-snug text-muted-foreground">
                          {displayFormula}
                        </p>
                      ) : null}
                      {releaseLabel ? (
                        <p className="text-xs text-muted-foreground">
                          Next release: <span className="text-foreground">{releaseLabel}</span>
                        </p>
                      ) : null}
                    </CardHeader>
                    <CardContent className="pb-2 pt-0">
                      <p className="font-mono text-[11px] leading-normal text-muted-foreground">
                        key: {row.key}
                      </p>
                    </CardContent>
                    <CardFooter className="mt-auto border-t border-border bg-muted/20 pt-4">
                      <SecondaryButton className="w-full" asChild>
                        <Link href={href}>Open in dashboard</Link>
                      </SecondaryButton>
                    </CardFooter>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Marketing copy and images can be updated by platform admins.{" "}
          <Link
            href={`${ORG_DASHBOARD}/multi-formula-screener`}
            className={cn("text-primary underline-offset-4 hover:underline")}
          >
            Multi-formula screener
          </Link>{" "}
          includes every score column in one grid.
        </p>
      </div>
    </div>
  );
}
