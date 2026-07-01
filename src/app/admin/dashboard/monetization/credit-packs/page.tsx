"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  fetchAdminCreditPacks,
  syncAdminCreditPacksFromStripe,
  type CreditPackAdminRow,
} from "@/lib/api";
import { StripeManagedBadge } from "@/components/admin/monetization/stripe-managed-badge";
import { formatPlanAmount } from "@/components/admin/monetization/format-plan-amount";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui-kit/data-table";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { PrimaryButton } from "@/components/ui-kit/buttons";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export default function AdminCreditPacksPage() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const [rows, setRows] = useState<CreditPackAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);

  const loadRows = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setRows(await fetchAdminCreditPacks(accessToken));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load credit packs");
    } finally {
      setLoading(false);
    }
  }, [accessToken, showError]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const runSync = async () => {
    if (!accessToken) return;
    setSyncing(true);
    try {
      const result = await syncAdminCreditPacksFromStripe(accessToken);
      showSuccess(
        `Sync complete: ${result.created} created, ${result.updated} updated, ${result.unchanged} unchanged`
      );
      if (result.errors.length > 0) {
        showError(result.errors.map((e) => `${e.pack_key}: ${e.message}`).join("; "));
      }
      await loadRows();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to sync from Stripe");
    } finally {
      setSyncing(false);
      setSyncDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Credit packs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only catalog synced from Stripe one-time prices with{" "}
            <code className="text-xs">credit_pack_key</code> metadata.
          </p>
        </div>
        <PrimaryButton type="button" onClick={() => setSyncDialogOpen(true)} disabled={syncing}>
          <RefreshCw className={cn("mr-2 size-4", syncing && "animate-spin")} aria-hidden />
          Sync from Stripe
        </PrimaryButton>
      </div>

      {loading ? (
        <LoadingSkeleton className="h-48 w-full rounded-2xl" />
      ) : rows.length === 0 ? (
        <EmptyState title="No credit packs" description="Sync from Stripe or seed credit_packs." />
      ) : (
        <DataTable stickyHeader>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Pack key</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Stripe product</TableHead>
              <TableHead>Stripe price</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <span>{row.name}</span>
                    <StripeManagedBadge />
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{row.pack_key}</TableCell>
                <TableCell>{row.credits_amount.toLocaleString()}</TableCell>
                <TableCell className="max-w-[120px] truncate font-mono text-xs">
                  {row.stripe_product_id ?? "—"}
                </TableCell>
                <TableCell className="max-w-[120px] truncate font-mono text-xs">
                  {row.stripe_price_id ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {formatPlanAmount({
                    plan_key: row.pack_key,
                    display_name: row.name,
                    billing_interval: null,
                    currency: row.currency,
                    amount_cents: row.unit_amount_cents,
                    unit_amount_cents: row.unit_amount_cents,
                    pricing_model: "flat",
                    seat_based_enabled: false,
                    is_active: row.is_active,
                    id: row.id,
                    stripe_product_id: row.stripe_product_id ?? "",
                    stripe_price_id: row.stripe_price_id ?? "",
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={row.is_active ? "default" : "secondary"}>
                    {row.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      <AlertDialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sync credit packs from Stripe?</AlertDialogTitle>
            <AlertDialogDescription>
              Upserts packs from active one-time Stripe prices that include credit_pack_key and
              credits_amount in product or price metadata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={syncing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void runSync()} disabled={syncing}>
              {syncing ? "Syncing…" : "Sync now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
