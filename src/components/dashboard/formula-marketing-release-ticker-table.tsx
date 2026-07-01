import type { FormulaMarketingReleaseLineRow } from "@/lib/api";
import { DataTable } from "@/components/ui-kit/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Props = {
  rows: FormulaMarketingReleaseLineRow[];
  className?: string;
};

function pickEntity(r: FormulaMarketingReleaseLineRow) {
  return r.entity_name ?? r.name ?? null;
}

/**
 * Renders API `rows` for a marketing release — same table primitives as score results pages.
 */
export function FormulaMarketingReleaseTickerTable({ rows, className }: Props) {
  const showRank = rows.some((r) => r.rank != null);
  const showConfidence = rows.some((r) => r.confidence != null);
  const showLabel = rows.some((r) => r.label != null);
  const showSummary = rows.some((r) => r.summary != null);
  const showExplanation = rows.some((r) => r.explanation != null);

  return (
    <DataTable className={className}>
      <TableHeader>
        <TableRow>
          {showRank ? <TableHead className="w-16">Rank</TableHead> : null}
          <TableHead>Ticker</TableHead>
          <TableHead>Entity</TableHead>
          <TableHead className="text-right">Score</TableHead>
          {showLabel ? <TableHead>Label</TableHead> : null}
          {showConfidence ? <TableHead className="text-right">Confidence</TableHead> : null}
          {showSummary ? <TableHead>Summary</TableHead> : null}
          {showExplanation ? <TableHead>Notes</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={`${row.ticker}-${i}`}>
            {showRank ? (
              <TableCell className="tabular-nums text-muted-foreground">
                {row.rank ?? "—"}
              </TableCell>
            ) : null}
            <TableCell className="font-medium">{row.ticker}</TableCell>
            <TableCell>{pickEntity(row) ?? "—"}</TableCell>
            <TableCell className="text-right tabular-nums">
              {row.score != null && typeof row.score === "number" ? row.score.toFixed(2) : "—"}
            </TableCell>
            {showLabel ? (
              <TableCell className="capitalize">{row.label ?? "—"}</TableCell>
            ) : null}
            {showConfidence ? (
              <TableCell className="text-right tabular-nums">
                {row.confidence != null && typeof row.confidence === "number"
                  ? `${(row.confidence * 100).toFixed(1)}%`
                  : "—"}
              </TableCell>
            ) : null}
            {showSummary ? (
              <TableCell className="max-w-xs truncate text-muted-foreground">
                {row.summary ?? "—"}
              </TableCell>
            ) : null}
            {showExplanation ? (
              <TableCell
                className={cn("max-w-xs truncate text-muted-foreground", !showSummary && "max-w-md")}
              >
                {row.explanation ?? "—"}
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  );
}
