"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { fetchHedgeFunds, type HedgeFundRow } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/ui-kit/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

const COLUMNS: {
  key: string;
  label: string;
  format?: (v: unknown) => string;
}[] = [
  { key: "filer", label: "Fund Name (filer)", format: (v) => String(v ?? "—") },
  {
    key: "hedge_fund_quality_score",
    label: "Hedge Fund Quality Score",
    format: (v) => (v != null ? Number(v).toFixed(2) : "—"),
  },
  {
    key: "f_13f_aum",
    label: "f_13f_aum",
    format: (v) => (v != null ? Number(v).toLocaleString() : "—"),
  },
  {
    key: "perf_5_yr_annualized",
    label: "perf_5_yr_annualized",
    format: (v) => (v != null ? Number(v).toFixed(2) : "—"),
  },
  {
    key: "alpha_3_yr",
    label: "alpha_3_yr",
    format: (v) => (v != null ? Number(v).toFixed(2) : "—"),
  },
  {
    key: "sortino_3_yr_equal_weight",
    label: "sortino_3_yr_equal_weight",
    format: (v) => (v != null ? Number(v).toFixed(2) : "—"),
  },
  {
    key: "pct_in_top_10",
    label: "pct_in_top_10",
    format: (v) => (v != null ? Number(v).toFixed(2) : "—"),
  },
  {
    key: "turnover",
    label: "turnover",
    format: (v) => (v != null ? Number(v).toFixed(2) : "—"),
  },
  {
    key: "perf_3_yr_annualized",
    label: "perf_3_yr_annualized",
    format: (v) => (v != null ? Number(v).toFixed(2) : "—"),
  },
  {
    key: "perf_10_yr_annualized",
    label: "perf_10_yr_annualized",
    format: (v) => (v != null ? Number(v).toFixed(2) : "—"),
  },
  {
    key: "avg_time_held",
    label: "avg_time_held",
    format: (v) => (v != null ? Number(v).toFixed(2) : "—"),
  },
  {
    key: "beta_5_yr",
    label: "beta_5_yr",
    format: (v) => (v != null ? Number(v).toFixed(2) : "—"),
  },
  {
    key: "stddev_3_yr",
    label: "stddev_3_yr",
    format: (v) => (v != null ? Number(v).toFixed(2) : "—"),
  },
  {
    key: "option_aum_pct",
    label: "option_aum_pct",
    format: (v) => (v != null ? Number(v).toFixed(2) : "—"),
  },
  {
    key: "etf_aum_pct",
    label: "etf_aum_pct",
    format: (v) => (v != null ? Number(v).toFixed(2) : "—"),
  },
  {
    key: "holdings",
    label: "holdings",
    format: (v) => (v != null ? Number(v).toLocaleString() : "—"),
  },
];

function getRowValue(row: HedgeFundRow, key: string): unknown {
  return row[key as keyof HedgeFundRow];
}

function PaginationBar({
  page,
  totalPages,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: {
  page: number;
  totalPages: number;
  limit: number;
  total: number;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
}) {
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          Showing {total === 0 ? 0 : from}–{to} of {total}
        </span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm dark:bg-input/30"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="rounded px-2 py-1 text-sm disabled:opacity-50"
        >
          First
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded px-2 py-1 text-sm disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-2 text-sm text-muted-foreground">
          Page {page} of {totalPages || 1}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded px-2 py-1 text-sm disabled:opacity-50"
        >
          Next
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="rounded px-2 py-1 text-sm disabled:opacity-50"
        >
          Last
        </button>
      </div>
    </div>
  );
}

export default function FundsPage() {
  const { accessToken } = useAuth();
  const { showError } = useToast();
  const [data, setData] = useState<HedgeFundRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sort, setSort] = useState("hedge_fund_quality_score");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    if (!accessToken) return;
    setIsLoading(true);
    fetchHedgeFunds(accessToken, { page, limit, sort, order })
      .then((res) => {
        setData(res.data);
        setTotal(res.total);
      })
      .catch(() => showError("Failed to load hedge funds"))
      .finally(() => setIsLoading(false));
  }, [accessToken, page, limit, sort, order, showError]);

  useEffect(() => load(), [load]);

  function handleSort(col: string) {
    if (sort === col) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSort(col);
      setOrder(col === "hedge_fund_quality_score" ? "desc" : "asc");
    }
    setPage(1);
  }

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Funds
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
          Hedge funds with quality scores and key metrics
          </p>
        </header>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-4">
            <PaginationBar
            page={page}
            totalPages={Math.ceil(total / limit) || 1}
            limit={limit}
            total={total}
            onPageChange={setPage}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
          </div>
          <div className="border-b border-border px-4 py-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : (
              <DataTable tableClassName="min-w-[1200px]">
                <TableHeader>
                  <TableRow>
                    {COLUMNS.map((col) => (
                      <TableHead
                        key={col.key}
                        className="cursor-pointer whitespace-nowrap"
                        onClick={() => handleSort(col.key)}
                      >
                        <span className="flex items-center gap-1">
                          {col.label}
                          {sort === col.key && <span>{order === "asc" ? "↑" : "↓"}</span>}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, i) => (
                    <TableRow
                      key={`${page}-${i}-${row.filer_id}`}
                      className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}
                    >
                      {COLUMNS.map((col) => (
                        <TableCell key={col.key} className="whitespace-nowrap text-foreground">
                          {col.format
                            ? col.format(getRowValue(row, col.key))
                            : String(getRowValue(row, col.key) ?? "—")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            )}
          </div>
          <div className="border-t border-border px-4 py-4">
            <PaginationBar
              page={page}
              totalPages={Math.ceil(total / limit) || 1}
              limit={limit}
              total={total}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
