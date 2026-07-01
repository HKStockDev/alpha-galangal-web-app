/** Maps formula score keys to evidence anchor panel section ids (CON-120). */
export const FORMULA_TO_ANCHOR_SECTION: Record<string, string> = {
  insider_conviction_score: "anchor-insider",
  net_exposure_score: "anchor-macro",
  fundamental_constriction_score: "anchor-earnings",
  political_score: "anchor-flows",
};

/** Deep link from a formula dashboard row to verifiable evidence on stock detail. */
export function stockEvidenceAnchorHref(
  securityId: string | null | undefined,
  formulaKey: string,
): string | null {
  if (!securityId) return null;
  const section = FORMULA_TO_ANCHOR_SECTION[formulaKey];
  if (!section) return null;
  return `/org/dashboard/stocks/${securityId}#${section}`;
}
