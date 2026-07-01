import {
  FUNDAMENTAL_CONTRICTION_MARKETING_KEY,
  INSIDER_CONVICTION_MARKETING_KEY,
  NET_EXPOSURE_MARKETING_KEY,
  POLITICAL_SCORE_MARKETING_KEY,
  STRUCTURAL_GROWTH_CAGR_MARKETING_KEY,
} from "@/lib/formula-marketing-keys";

const SUBTITLES: Record<string, string> = {
  [NET_EXPOSURE_MARKETING_KEY]:
    "Structural tailwind vs headwind from theme exposures. Positive net = alignment; negative = vulnerability.",
  [FUNDAMENTAL_CONTRICTION_MARKETING_KEY]:
    "Composite of earnings acceleration, margins, ROIC, valuation, and balance-sheet signals.",
  [POLITICAL_SCORE_MARKETING_KEY]:
    "Congressional trade signal from disclosures, committee relevance, and clustering (−100 to +100).",
  [INSIDER_CONVICTION_MARKETING_KEY]:
    "Open-market insider buy vs sell pressure, weighted by role and recency (−100 to +100).",
  [STRUCTURAL_GROWTH_CAGR_MARKETING_KEY]:
    "Taxonomy CAGR bucket scores blended into a composite structural growth signal.",
};

export function formulaSubtitle(formulaKey: string): string | undefined {
  return SUBTITLES[formulaKey];
}

export const FORMULA_DISCLOSURE_NOTE =
  "System formulas show a conceptual summary. Exact proprietary equations are not displayed.";
