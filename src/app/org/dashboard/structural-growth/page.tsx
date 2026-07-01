"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  getStructuralGrowthCagrScoreFormula,
  getTaxonomyStructuralGrowthCagrScores,
  type StructuralGrowthCagrFormulaWeights,
  type TaxonomyCagrEntityTypeFilter,
  type TaxonomyCagrScoresResponse,
} from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { SectionCard } from "@/components/ui-kit/cards";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui-kit/data-table";
import { FormLabel } from "@/components/ui-kit/forms";
import { AdminFormulaMarketingSection } from "@/components/dashboard/admin-formula-marketing-section";
import { FormulaMarketingPreviewButtons } from "@/components/dashboard/formula-marketing-preview-buttons";
import { FormulaPageResultsSettingsTabs } from "@/components/dashboard/formula-page-results-settings-tabs";
import { STRUCTURAL_GROWTH_CAGR_MARKETING_KEY } from "@/lib/formula-marketing-keys";
import { ORG_DASHBOARD } from "@/lib/auth-routing";
import { FormulaExplanationSection } from "@/components/formulas/formula-explanation-section";

const WEIGHT_ORDER: {
  key: keyof StructuralGrowthCagrFormulaWeights;
  label: string;
}[] = [
  { key: "sg_cagr_score_3y", label: "3-year bucket score" },
  { key: "sg_cagr_score_5y", label: "5-year bucket score" },
  { key: "sg_cagr_score_10y", label: "10-year bucket score" },
];

const LIMIT_OPTIONS = [250, 500, 1000, 2000] as const;

function formatScore(v: number | null): string {
  if (v === null || Number.isNaN(v)) return "—";
  return v.toFixed(1);
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function entityTypeLabel(t: string): string {
  if (t === "sub_industry") return "Sub-industry";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default function OrgStructuralGrowthPage() {
  const pathname = usePathname();
  const showSubheading = pathname?.startsWith(ORG_DASHBOARD) ?? false;
  const { accessToken } = useAuth();
  const { showError } = useToast();
  const [formulaLoading, setFormulaLoading] = useState(true);
  const [weights, setWeights] = useState<StructuralGrowthCagrFormulaWeights | null>(
    null
  );
  const [scoreLimit, setScoreLimit] = useState<number>(500);
  const [entityFilter, setEntityFilter] = useState<TaxonomyCagrEntityTypeFilter | "">(
    ""
  );
  const [scoresLoading, setScoresLoading] = useState(true);
  const [scoresData, setScoresData] = useState<TaxonomyCagrScoresResponse | null>(
    null
  );

  useEffect(() => {
    if (!accessToken) return;
    setFormulaLoading(true);
    getStructuralGrowthCagrScoreFormula(accessToken)
      .then((res) => {
        const w = res.formula?.definition?.weights as
          | StructuralGrowthCagrFormulaWeights
          | undefined;
        if (w) setWeights(w);
      })
      .catch(() => showError("Could not load structural growth CAGR formula."))
      .finally(() => setFormulaLoading(false));
  }, [accessToken, showError]);

  useEffect(() => {
    if (!accessToken) return;
    setScoresLoading(true);
    getTaxonomyStructuralGrowthCagrScores(accessToken, {
      limit: scoreLimit,
      entityType: entityFilter || undefined,
    })
      .then(setScoresData)
      .catch(() => showError("Could not load taxonomy CAGR scores."))
      .finally(() => setScoresLoading(false));
  }, [accessToken, scoreLimit, entityFilter, showError]);

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Structural growth
            </h1>
            {showSubheading ? (
              <p className="text-base text-muted-foreground">
                Taxonomy CAGR bucket scores and the composite weights used for{" "}
                <span className="font-mono text-foreground">sg_cagr_composite_score</span>.
              </p>
            ) : null}
          </div>
          <FormulaMarketingPreviewButtons className="shrink-0 self-end sm:self-start" />
        </header>

        <FormulaPageResultsSettingsTabs
          results={
            <>
        <FormulaExplanationSection formulaKey={STRUCTURAL_GROWTH_CAGR_MARKETING_KEY} />

        <SectionCard className="text-sm text-card-foreground">
          <p className="text-muted-foreground">
            <strong className="text-foreground">Organization view (read-only).</strong> The LLM
            pipeline that fills bucket scores runs from the platform admin area{" "}
            <span className="whitespace-nowrap">(Admin → Formulas → Taxonomy structural growth)</span>.
            The table lists up to{" "}
            {scoreLimit.toLocaleString()} taxonomy nodes for the selected level, ordered by name.
            Very large taxonomies use a capped pool before slicing so the first page stays fast.
          </p>
        </SectionCard>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Composite weights</h2>
          {formulaLoading ? (
            <LoadingSkeleton variant="card" lines={3} className="max-w-xl" />
          ) : !weights ? (
            <EmptyState
              description={
                <>
                  No CAGR composite formula was found. Ensure migration{" "}
                  <span className="font-mono">20260409120000_structural_growth_cagr_score_factors_formula</span>{" "}
                  has been applied and SKE-71 structural growth is seeded.
                </>
              }
            />
          ) : (
            <div className="space-y-4">
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {WEIGHT_ORDER.map(({ key, label }) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{label}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {weights[key].toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-lg font-semibold text-foreground">Taxonomy scores</h2>
            <div className="flex flex-wrap items-end gap-4">
              <div className="grid gap-1.5">
                <FormLabel htmlFor="sg-limit">Rows to load</FormLabel>
                <select
                  id="sg-limit"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={scoreLimit}
                  onChange={(e) => setScoreLimit(parseInt(e.target.value, 10))}
                >
                  {LIMIT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <FormLabel htmlFor="sg-type">Taxonomy level</FormLabel>
                <select
                  id="sg-type"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={entityFilter}
                  onChange={(e) =>
                    setEntityFilter(e.target.value as TaxonomyCagrEntityTypeFilter | "")
                  }
                >
                  <option value="">All (sector, industry, sub-industry)</option>
                  <option value="sector">Sector</option>
                  <option value="industry">Industry</option>
                  <option value="sub_industry">Sub-industry</option>
                </select>
              </div>
            </div>
          </div>

          {scoresLoading ? (
            <LoadingSkeleton variant="card" lines={4} />
          ) : scoresData ? (
            <>
              <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">Taxonomy nodes (total)</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {scoresData.summary.totalTaxonomyEntities.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Shown in table</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {scoresData.summary.tableShown.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">In table: all 3 horizons / composite</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {scoresData.summary.withAllHorizonsInTable.toLocaleString()} /{" "}
                    {scoresData.summary.withCompositeInTable.toLocaleString()}
                  </p>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-muted-foreground">Latest score update (any factor)</p>
                  <p className="font-medium text-foreground">
                    {formatWhen(scoresData.summary.lastScoreUpdateAt)}
                  </p>
                </div>
              </div>

              <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">3y</TableHead>
                      <TableHead className="text-right">5y</TableHead>
                      <TableHead className="text-right">10y</TableHead>
                      <TableHead className="text-right">Composite</TableHead>
                      <TableHead>Row updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scoresData.rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-muted-foreground">
                          No taxonomy entities match the filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      scoresData.rows.map((r) => (
                        <TableRow key={r.entityId}>
                          <TableCell className="whitespace-nowrap">
                            {entityTypeLabel(r.entityType)}
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate font-medium">
                            {r.title ?? "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {r.code ?? "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatScore(r.score3y)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatScore(r.score5y)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatScore(r.score10y)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatScore(r.composite)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {formatWhen(r.scoresUpdatedAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </DataTable>
            </>
          ) : null}
        </section>
            </>
          }
          settings={
            <AdminFormulaMarketingSection
              formulaKey={STRUCTURAL_GROWTH_CAGR_MARKETING_KEY}
              contextLabel="Structural growth (CAGR)"
            />
          }
        />
      </div>
    </div>
  );
}
