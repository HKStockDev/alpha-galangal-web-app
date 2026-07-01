"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { fetchAdminCreditTransactions, type CreditTransactionRow } from "@/lib/api";
import { formatAdminDateTime } from "@/components/admin/monetization/format-datetime";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui-kit/data-table";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import { SecondaryButton } from "@/components/ui-kit/buttons";

export default function AdminCreditTransactionsPage() {
  const { accessToken } = useAuth();
  const { showError } = useToast();
  const [rows, setRows] = useState<CreditTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState("");
  const [txType, setTxType] = useState("");

  const loadRows = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setRows(
        await fetchAdminCreditTransactions(accessToken, {
          organization_id: orgId.trim() || undefined,
          tx_type: txType.trim() || undefined,
          limit: 100,
        })
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  }, [accessToken, orgId, txType, showError]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  return (
    <div className="space-y-4 pb-10">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Credit ledger</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Immutable audit log of purchases, consumption, grants, and expirations.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <FormLabel htmlFor="org-id">Organization ID</FormLabel>
          <FormInput
            id="org-id"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            placeholder="UUID"
            className="w-72 font-mono text-xs"
          />
        </div>
        <div className="space-y-1">
          <FormLabel htmlFor="tx-type">Transaction type</FormLabel>
          <select
            id="tx-type"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={txType}
            onChange={(e) => setTxType(e.target.value)}
          >
            <option value="">All</option>
            <option value="purchase">purchase</option>
            <option value="consume">consume</option>
            <option value="base_grant">base_grant</option>
            <option value="base_reset">base_reset</option>
            <option value="expire">expire</option>
            <option value="refund">refund</option>
            <option value="adjust">adjust</option>
          </select>
        </div>
        <SecondaryButton type="button" onClick={() => void loadRows()}>
          Apply filters
        </SecondaryButton>
      </div>

      {loading ? (
        <LoadingSkeleton className="h-48 w-full rounded-2xl" />
      ) : rows.length === 0 ? (
        <EmptyState title="No transactions" description="Adjust filters or wait for credit activity." />
      ) : (
        <DataTable stickyHeader>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Bucket</TableHead>
              <TableHead className="text-right">Delta</TableHead>
              <TableHead>Capability</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Org</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{formatAdminDateTime(row.occurred_at)}</TableCell>
                <TableCell className="font-mono text-xs">{row.tx_type}</TableCell>
                <TableCell>{row.bucket_type}</TableCell>
                <TableCell className="text-right font-medium">
                  {row.credits_delta > 0 ? "+" : ""}
                  {row.credits_delta}
                </TableCell>
                <TableCell className="font-mono text-xs">{row.capability_key ?? "—"}</TableCell>
                <TableCell className="max-w-[120px] truncate font-mono text-xs">
                  {row.reference_id ?? "—"}
                </TableCell>
                <TableCell className="max-w-[100px] truncate font-mono text-xs">
                  {row.organization_id}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}
    </div>
  );
}
