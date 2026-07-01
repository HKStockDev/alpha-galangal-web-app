"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import { Spinner } from "@/components/ui/spinner";
import { fetchMyOrganizations, listOrganizationEquities, type OrgEquityRow } from "@/lib/api";

const LIST_LIMIT = 120;

function formatCap(v: number | null): string {
  if (v == null || Number.isNaN(Number(v))) return "—";
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  return v.toLocaleString();
}

function StockCard({ row }: { row: OrgEquityRow }) {
  return (
    <Link
      href={`/org/dashboard/stocks/${row.id}`}
      className="group block rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-base font-bold tracking-tight text-foreground">
            {row.ticker}
          </p>
          <p className="truncate text-sm text-muted-foreground">{row.name}</p>
        </div>
        {row.primary_exchange && (
          <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {row.primary_exchange}
          </span>
        )}
      </div>

      <div className="mt-3 border-t border-border pt-3 grid grid-cols-2 gap-x-4 gap-y-1">
        <div>
          <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Market Cap</p>
          <p className="text-xs font-medium text-foreground">{formatCap(row.market_cap)}</p>
        </div>
        <div>
          <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Sector</p>
          <p className="truncate text-xs font-medium text-foreground">{row.sector_title ?? "—"}</p>
        </div>
        <div className="col-span-2 mt-1">
          <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Industry</p>
          <p className="truncate text-xs font-medium text-foreground">{row.industry_title ?? "—"}</p>
        </div>
      </div>
    </Link>
  );
}

export default function StocksLandingPage() {
  const { accessToken } = useAuth();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OrgEquityRow[]>([]);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    fetchMyOrganizations(accessToken)
      .then(async (orgs) => {
        if (orgs.length === 0) throw new Error("No organization found");
        const data = await listOrganizationEquities(accessToken, orgs[0].id, {
          limit: LIST_LIMIT,
          offset: 0,
          cycle_horizon: "24m",
        });
        setRows(data.items);
      })
      .catch((err) =>
        showError(err instanceof Error ? err.message : "Failed to load stocks")
      )
      .finally(() => setLoading(false));
  }, [accessToken, showError]);

  const visibleRows = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.ticker.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
    );
  }, [rows, searchInput]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Stock details
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse stocks and click a card to view the full details page.
          </p>
        </div>

        <div className="space-y-2 sm:max-w-sm">
          <FormLabel htmlFor="stocks-search">Search by ticker or name</FormLabel>
          <FormInput
            id="stocks-search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="e.g. AAPL or Apple"
            autoComplete="off"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Showing{" "}
          <span className="font-semibold text-foreground">
            {visibleRows.length.toLocaleString()}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground">
            {rows.length.toLocaleString()}
          </span>{" "}
          stocks
        </p>

        {visibleRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No stocks match this search.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleRows.map((row) => (
              <StockCard key={row.id} row={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
