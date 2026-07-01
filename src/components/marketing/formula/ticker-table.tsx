"use client";

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTable } from "@/components/ui-kit/data-table";
import type { PublicReleaseRow } from "@/lib/public-marketing-api";

export function TickerTable({ rows }: { rows: PublicReleaseRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No tickers in this release.</p>
    );
  }
  return (
    <DataTable>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>Ticker</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead>Explanation</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={`${r.ticker}-${i}`}>
            <TableCell className="tabular-nums text-muted-foreground">
              {r.rank ?? "—"}
            </TableCell>
            <TableCell className="font-mono font-medium">{r.ticker}</TableCell>
            <TableCell className="max-w-[12rem] truncate">{r.name ?? "—"}</TableCell>
            <TableCell className="text-right tabular-nums">
              {r.score != null ? r.score : "—"}
            </TableCell>
            <TableCell className="max-w-md text-sm text-muted-foreground">
              {r.explanation ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  );
}
