"use client";

import type { FormulaMarketingRow } from "@/lib/api";
import { FORMULA_DISCLOSURE_NOTE, formulaSubtitle } from "@/lib/formula-explanation-copy";
import { marketingCategoryLabel } from "@/lib/org-formula-dashboard-links";
import { SectionCard } from "@/components/ui-kit/cards";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { Badge } from "@/components/ui/badge";

type Props = {
  formulaKey: string;
  marketing: FormulaMarketingRow | null;
  loading?: boolean;
  compact?: boolean;
};

export function FormulaExplanationPanel({
  formulaKey,
  marketing,
  loading,
  compact,
}: Props) {
  const subtitle = formulaSubtitle(formulaKey);
  const category = marketing ? marketingCategoryLabel(marketing.marketing_settings) : null;
  const description =
    typeof marketing?.description === "string" && marketing.description.trim()
      ? marketing.description.trim()
      : null;
  const displayFormula =
    typeof marketing?.display_formula === "string" && marketing.display_formula.trim()
      ? marketing.display_formula.trim()
      : null;

  if (loading) {
    return <LoadingSkeleton variant="card" lines={compact ? 2 : 4} />;
  }

  return (
    <SectionCard className={compact ? "p-4" : undefined}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">
            {marketing?.name ?? "About this formula"}
          </h2>
          {category ? (
            <Badge variant="outline" className="font-normal">
              {category}
            </Badge>
          ) : null}
        </div>
        {subtitle ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        ) : null}
        {description ? (
          <p className="text-sm leading-relaxed text-foreground/90">{description}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">No description available yet.</p>
        )}
        {displayFormula ? (
          <div className="overflow-x-auto rounded-lg border border-border bg-muted/40 px-4 py-3 font-mono text-sm text-foreground">
            {displayFormula}
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">{FORMULA_DISCLOSURE_NOTE}</p>
      </div>
    </SectionCard>
  );
}
