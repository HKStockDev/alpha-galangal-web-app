"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ADMIN_DASHBOARD } from "@/lib/auth-routing";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  fetchAdminMonetizationPlans,
  syncAdminMonetizationPlansFromStripe,
  type SubscriptionPlanAdminRow,
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
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

type ActiveFilter = "all" | "active" | "inactive";

export default function AdminMonetizationPlansPage() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const [rows, setRows] = useState<SubscriptionPlanAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);

  const loadRows = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const activeOption =
        activeFilter === "all"
          ? undefined
          : activeFilter === "active"
            ? true
            : false;
      const data = await fetchAdminMonetizationPlans(accessToken, {
        active: activeOption,
      });
      setRows(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, [accessToken, activeFilter, showError]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const runSync = async () => {
    if (!accessToken) return;
    setSyncing(true);
    try {
      const result = await syncAdminMonetizationPlansFromStripe(accessToken);
      const parts = [
        `${result.updated} updated`,
        `${result.unchanged} unchanged`,
        `${result.skipped} skipped`,
      ];
      if (result.errors.length > 0) {
        parts.push(`${result.errors.length} errors`);
      }
      showSuccess(`Stripe sync complete: ${parts.join(", ")}`);
      if (result.errors.length > 0) {
        showError(
          result.errors.map((e) => `${e.plan_key}: ${e.message}`).join("; ")
        );
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
          <h2 className="text-xl font-semibold text-foreground">Plans catalog</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only view of Stripe-mapped prices. Names and amounts are synced from Stripe.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StripeManagedBadge />
          <PrimaryButton
            type="button"
            onClick={() => setSyncDialogOpen(true)}
            disabled={syncing || loading}
          >
            <RefreshCw className={cn("mr-2 size-4", syncing && "animate-spin")} aria-hidden />
            Sync from Stripe
          </PrimaryButton>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "all" as const, label: "All" },
            { id: "active" as const, label: "Active" },
            { id: "inactive" as const, label: "Inactive" },
          ] as const
        ).map((item) => (
          <SecondaryButton
            key={item.id}
            type="button"
            size="sm"
            className={cn(activeFilter === item.id && "border-primary bg-primary/10 text-primary")}
            onClick={() => setActiveFilter(item.id)}
          >
            {item.label}
          </SecondaryButton>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton className="h-48 w-full rounded-2xl" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No plans found"
          description="Adjust the filter or seed subscription_plans in the database."
        />
      ) : (
        <DataTable stickyHeader>
          <TableHeader>
            <TableRow>
              <TableHead>Display name</TableHead>
              <TableHead>Plan key</TableHead>
              <TableHead>Stripe product</TableHead>
              <TableHead>Stripe price</TableHead>
              <TableHead>Pricing model</TableHead>
              <TableHead>Interval</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <span>{row.display_name ?? "—"}</span>
                    <StripeManagedBadge />
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{row.plan_key}</TableCell>
                <TableCell className="max-w-[140px] truncate font-mono text-xs">
                  {row.stripe_product_id}
                </TableCell>
                <TableCell className="max-w-[140px] truncate font-mono text-xs">
                  {row.stripe_price_id}
                </TableCell>
                <TableCell className="capitalize">{row.pricing_model.replace("_", " ")}</TableCell>
                <TableCell>{row.billing_interval ?? "—"}</TableCell>
                <TableCell className="text-right">{formatPlanAmount(row)}</TableCell>
                <TableCell>
                  <Badge variant={row.is_active ? "default" : "secondary"}>
                    {row.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <SecondaryButton asChild size="sm">
                    <Link
                      href={`${ADMIN_DASHBOARD}/monetization/plans/${row.id}/capabilities`}
                    >
                      Manage capabilities
                    </Link>
                  </SecondaryButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      <AlertDialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sync plans from Stripe?</AlertDialogTitle>
            <AlertDialogDescription>
              This updates cached display names, amounts, billing intervals, and active flags from
              Stripe for all plans with real product and price IDs. Placeholder seed IDs are
              skipped.
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
