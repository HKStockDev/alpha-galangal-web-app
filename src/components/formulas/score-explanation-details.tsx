"use client";

import { scoreExplanationLines } from "@/lib/formula-explanation-parsers";
import { FORMULA_TO_ANCHOR_SECTION } from "@/lib/score-anchor-links";

export function ScoreExplanationDetails({
  formulaKey,
  explanation,
  showAnchorLink = false,
  evidenceHref,
}: {
  formulaKey: string;
  explanation: Record<string, unknown> | null | undefined;
  showAnchorLink?: boolean;
  /** Full URL (e.g. stock detail + hash). Falls back to in-page hash when omitted. */
  evidenceHref?: string | null;
}) {
  const lines = scoreExplanationLines(formulaKey, explanation);
  const anchorId = FORMULA_TO_ANCHOR_SECTION[formulaKey];
  const href = evidenceHref ?? (anchorId ? `#${anchorId}` : null);
  if (lines.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No score breakdown stored for this row.</p>
    );
  }
  return (
    <div className="space-y-3">
      <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {lines.map((line) => (
          <div key={line.label}>
            <span className="font-medium text-foreground">{line.label}</span>
            <div className="font-mono tabular-nums text-muted-foreground">{line.value}</div>
          </div>
        ))}
      </div>
      {showAnchorLink && href ? (
        <a
          href={href}
          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          View supporting evidence →
        </a>
      ) : null}
    </div>
  );
}
