"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { fetchAdminCreditWallets, type AdminCreditWalletRow } from "@/lib/api";
import { formatAdminDateTime } from "@/components/admin/monetization/format-datetime";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui-kit/data-table";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import { SecondaryButton } from "@/components/ui-kit/buttons";

function orgName(row: AdminCreditWalletRow): string {
  const org = row.organizations;
  if (!org) return row.organization_id;
  if (Array.isArray(org)) return org[0]?.name ?? row.organization_id;
  return org.name;
}

export default function AdminCreditWalletsPage() {
  const { accessToken } = useAuth();
  const { showError } = useToast();
  const [rows, setRows] = useState<AdminCreditWalletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadRows = useCallback(
    async (q?: string) => {
      if (!accessToken) return;
      setLoading(true);
      try {
        setRows(await fetchAdminCreditWallets(accessToken, { q: q?.trim() || undefined, limit: 50 }));
      } catch (err) {
        showError(err instanceof Error ? err.message : "Failed to load wallets");
      } finally {
        setLoading(false);
      }
    },
    [accessToken, showError]
  );

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  return (
    <div className="space-y-4 pb-10">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Organization wallets</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Per-org base and pack credit balances with billing cycle dates.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <FormLabel htmlFor="wallet-search">Search organization</FormLabel>
          <FormInput
            id="wallet-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Organization name"
            className="w-64"
          />
        </div>
        <SecondaryButton type="button" onClick={() => void loadRows(search)}>
          Search
        </SecondaryButton>
      </div>

      {loading ? (
        <LoadingSkeleton className="h-48 w-full rounded-2xl" />
      ) : rows.length === 0 ? (
        <EmptyState title="No wallets found" description="Try another search or create subscriptions." />
      ) : (
        <DataTable stickyHeader>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Base remaining</TableHead>
              <TableHead>Base in cycle</TableHead>
              <TableHead>Pack remaining</TableHead>
              <TableHead>Cycle start</TableHead>
              <TableHead>Cycle end</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{orgName(row)}</TableCell>
                <TableCell>{row.base_credits_remaining.toLocaleString()}</TableCell>
                <TableCell>{row.base_credits_in_cycle.toLocaleString()}</TableCell>
                <TableCell>{row.pack_credits_remaining.toLocaleString()}</TableCell>
                <TableCell>{formatAdminDateTime(row.cycle_start)}</TableCell>
                <TableCell>{formatAdminDateTime(row.cycle_end)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}
    </div>
  );
}
