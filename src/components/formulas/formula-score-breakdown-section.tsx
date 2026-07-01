"use client";

import { useState } from "react";
import {
  FORMULA_SCORE_LABELS,
  scoreExplanationSummary,
} from "@/lib/formula-explanation-parsers";
import { ScoreExplanationDetails } from "./score-explanation-details";
import { FORMULA_TO_ANCHOR_SECTION } from "@/lib/score-anchor-links";
import { cn } from "@/lib/utils";
import { GhostButton } from "@/components/ui-kit/buttons";

const SCORE_KEYS = [
  "fundamental_constriction_score",
  "net_exposure_score",
  "insider_conviction_score",
  "political_score",
] as const;

type ScoreKey = (typeof SCORE_KEYS)[number];

function formatScore(v: number | null): string {
  if (v == null || Number.isNaN(v)) return "—";
  return String(Math.round(v * 1000) / 1000);
}

export function FormulaScoreBreakdownSection({
  scores,
  scoreBreakdowns,
}: {
  scores: Record<ScoreKey, number | null>;
  scoreBreakdowns: Partial<Record<ScoreKey, Record<string, unknown> | null>>;
}) {
  const [expanded, setExpanded] = useState<ScoreKey | null>(null);

  return (
    <div className="space-y-3">
      {SCORE_KEYS.map((key) => {
        const score = scores[key];
        const breakdown = scoreBreakdowns[key];
        const summary = scoreExplanationSummary(key, breakdown);
        const isOpen = expanded === key;
        const label = FORMULA_SCORE_LABELS[key] ?? key;
        return (
          <div
            key={key}
            className="rounded-xl border border-border bg-card shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                {summary ? (
                  <p className="text-xs text-muted-foreground">{summary}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
                  {formatScore(score)}
                </span>
                {breakdown && Object.keys(breakdown).length > 0 ? (
                  <GhostButton
                    type="button"
                    size="sm"
                    onClick={() => setExpanded(isOpen ? null : key)}
                  >
                    {isOpen ? "Hide" : "Why?"}
                  </GhostButton>
                ) : null}
              </div>
            </div>
            {isOpen ? (
              <div className={cn("space-y-3 border-t border-border px-4 py-3")}>
                <ScoreExplanationDetails formulaKey={key} explanation={breakdown} />
                {FORMULA_TO_ANCHOR_SECTION[key] ? (
                  <a
                    href={`#${FORMULA_TO_ANCHOR_SECTION[key]}`}
                    className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                  >
                    View supporting evidence →
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
