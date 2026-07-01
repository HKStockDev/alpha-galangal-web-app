import { ORG_DASHBOARD } from "@/lib/auth-routing";
import {
  FUNDAMENTAL_CONTRICTION_MARKETING_KEY,
  INSIDER_CONVICTION_MARKETING_KEY,
  NET_EXPOSURE_MARKETING_KEY,
  POLITICAL_SCORE_MARKETING_KEY,
  STRUCTURAL_GROWTH_CAGR_MARKETING_KEY,
} from "@/lib/formula-marketing-keys";

/** Map `formulas.key` to the org dashboard tool page for that score. */
const FORMULA_KEY_TO_SEGMENT: Record<string, string> = {
  [FUNDAMENTAL_CONTRICTION_MARKETING_KEY]: "/fundamental-constriction",
  [POLITICAL_SCORE_MARKETING_KEY]: "/political-score",
  [INSIDER_CONVICTION_MARKETING_KEY]: "/insider-conviction",
  [NET_EXPOSURE_MARKETING_KEY]: "/net-exposure",
  [STRUCTURAL_GROWTH_CAGR_MARKETING_KEY]: "/structural-growth",
};

/** Primary action for a formula card: dedicated page when known, else multi-formula screener. */
export function orgDashboardHrefForFormulaKey(key: string): string {
  const segment = FORMULA_KEY_TO_SEGMENT[key];
  if (segment) return `${ORG_DASHBOARD}${segment}`;
  return `${ORG_DASHBOARD}/multi-formula-screener`;
}

export function marketingCategoryLabel(
  settings: Record<string, unknown> | null | undefined
): string | null {
  if (!settings || typeof settings !== "object") return null;
  const category = settings.category;
  if (typeof category === "string" && category.trim()) return category.trim();
  const pillar = settings.pillar;
  if (typeof pillar === "string" && pillar.trim()) return pillar.trim();
  return null;
}
