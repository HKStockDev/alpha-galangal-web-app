import {
  FUNDAMENTAL_CONTRICTION_MARKETING_KEY,
  INSIDER_CONVICTION_MARKETING_KEY,
  NET_EXPOSURE_MARKETING_KEY,
  POLITICAL_SCORE_MARKETING_KEY,
} from "@/lib/formula-marketing-keys";

function fmtNum(v: unknown, digits = 3): string {
  if (typeof v !== "number" || Number.isNaN(v)) return "—";
  return String(Math.round(v * 10 ** digits) / 10 ** digits);
}

function fmtUsd(n: number): string {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export type FormulaScoreKey =
  | typeof NET_EXPOSURE_MARKETING_KEY
  | typeof FUNDAMENTAL_CONTRICTION_MARKETING_KEY
  | typeof POLITICAL_SCORE_MARKETING_KEY
  | typeof INSIDER_CONVICTION_MARKETING_KEY;

export type ScoreExplanationLine = { label: string; value: string };

export function scoreExplanationSummary(
  formulaKey: string,
  explanation: Record<string, unknown> | null | undefined
): string | null {
  if (!explanation) return null;
  switch (formulaKey) {
    case NET_EXPOSURE_MARKETING_KEY: {
      const tail = explanation.tailwind;
      const head = explanation.headwind;
      if (typeof tail === "number" && typeof head === "number") {
        return `Tailwind ${fmtNum(tail)} · Headwind ${fmtNum(head)}`;
      }
      return null;
    }
    case INSIDER_CONVICTION_MARKETING_KEY: {
      const buy = explanation.buyPressure;
      const sell = explanation.sellPressure;
      if (typeof buy === "number" && typeof sell === "number") {
        return `Buy ${fmtUsd(buy)} · Sell ${fmtUsd(sell)}`;
      }
      return null;
    }
    case POLITICAL_SCORE_MARKETING_KEY: {
      const buy = explanation.buyPressure;
      const sell = explanation.sellPressure;
      const trades = explanation.tradesUsed;
      if (typeof buy === "number" && typeof sell === "number") {
        const t = typeof trades === "number" ? ` · ${trades} trades` : "";
        return `Buy pressure ${fmtUsd(buy)} · Sell ${fmtUsd(sell)}${t}`;
      }
      return null;
    }
    case FUNDAMENTAL_CONTRICTION_MARKETING_KEY: {
      const p = explanation.percentiles as Record<string, unknown> | undefined;
      if (p) {
        const top = Object.entries(p)
          .filter(([, v]) => typeof v === "number")
          .sort((a, b) => (b[1] as number) - (a[1] as number))[0];
        if (top) return `Strongest driver: ${top[0].replace(/_/g, " ")} (${fmtNum(top[1])})`;
      }
      return null;
    }
    default:
      return null;
  }
}

export function scoreExplanationLines(
  formulaKey: string,
  explanation: Record<string, unknown> | null | undefined
): ScoreExplanationLine[] {
  if (!explanation) return [];
  switch (formulaKey) {
    case NET_EXPOSURE_MARKETING_KEY:
      return [
        { label: "Tailwind", value: fmtNum(explanation.tailwind) },
        { label: "Headwind", value: fmtNum(explanation.headwind) },
        { label: "Exposure rows used", value: fmtNum(explanation.rowsUsed, 0) },
        { label: "Rows without polarity", value: fmtNum(explanation.noPolarityRows, 0) },
      ];
    case INSIDER_CONVICTION_MARKETING_KEY:
      return [
        { label: "Buy pressure", value: fmtUsd(Number(explanation.buyPressure ?? 0)) },
        { label: "Sell pressure", value: fmtUsd(Number(explanation.sellPressure ?? 0)) },
        { label: "Net pressure", value: fmtUsd(Number(explanation.netPressure ?? 0)) },
        { label: "Trades used", value: fmtNum(explanation.tradesUsed, 0) },
        { label: "Unique buyers", value: fmtNum(explanation.uniqueBuyers, 0) },
        { label: "Unique sellers", value: fmtNum(explanation.uniqueSellers, 0) },
      ];
    case POLITICAL_SCORE_MARKETING_KEY: {
      const lines: ScoreExplanationLine[] = [
        { label: "Buy pressure", value: fmtUsd(Number(explanation.buyPressure ?? 0)) },
        { label: "Sell pressure", value: fmtUsd(Number(explanation.sellPressure ?? 0)) },
        { label: "Trades used", value: fmtNum(explanation.tradesUsed, 0) },
      ];
      const fa = explanation.factorAverages as Record<string, unknown> | undefined;
      if (fa) {
        for (const [k, v] of Object.entries(fa)) {
          lines.push({ label: k.replace(/_/g, " "), value: fmtNum(v) });
        }
      }
      return lines;
    }
    case FUNDAMENTAL_CONTRICTION_MARKETING_KEY: {
      const lines: ScoreExplanationLine[] = [];
      const raw = explanation.raw as Record<string, unknown> | undefined;
      if (raw) {
        for (const [k, v] of Object.entries(raw)) {
          lines.push({ label: k.replace(/([A-Z])/g, " $1").trim(), value: fmtNum(v) });
        }
      }
      const p = explanation.percentiles as Record<string, unknown> | undefined;
      if (p) {
        for (const [k, v] of Object.entries(p)) {
          lines.push({ label: `${k.replace(/_/g, " ")} (pct)`, value: fmtNum(v) });
        }
      }
      return lines;
    }
    default:
      return Object.entries(explanation).map(([k, v]) => ({
        label: k,
        value: typeof v === "object" ? JSON.stringify(v) : String(v),
      }));
  }
}

export const FORMULA_SCORE_LABELS: Record<string, string> = {
  [NET_EXPOSURE_MARKETING_KEY]: "Net exposure",
  [FUNDAMENTAL_CONTRICTION_MARKETING_KEY]: "Fundamental constriction",
  [POLITICAL_SCORE_MARKETING_KEY]: "Political score",
  [INSIDER_CONVICTION_MARKETING_KEY]: "Insider conviction",
};
