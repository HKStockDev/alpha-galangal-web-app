"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { ADMIN_DASHBOARD } from "@/lib/auth-routing";
import {
  bulkEnableAdminReadonlyEntitlements,
  copyAdminPlanEntitlements,
  fetchAdminEntitlementsMatrix,
  fetchAdminMonetizationPlans,
  type EntitlementsMatrixResponse,
  type SubscriptionPlanAdminRow,
} from "@/lib/api";
import { PlanCapabilitiesList } from "@/components/admin/monetization/plan-capabilities-list";
import {
  buildPlanCapabilityRows,
  ensurePlanInMatrix,
} from "@/components/admin/monetization/plan-capabilities-utils";
import { useOptimisticEntitlement } from "@/components/admin/monetization/use-optimistic-entitlement";
import { StripeManagedBadge } from "@/components/admin/monetization/stripe-managed-badge";
import { formatPlanAmount } from "@/components/admin/monetization/format-plan-amount";
import { EntitlementsMatrixSkeleton } from "@/components/admin/monetization/entitlements-matrix-skeleton";
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
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { FormLabel } from "@/components/ui-kit/forms";
import { cn } from "@/lib/utils";
import { ArrowLeft, LayoutGrid } from "lucide-react";

const selectClass = cn(
  "h-9 min-w-[12rem] rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
);

export default function AdminPlanCapabilitiesPage() {
  const params = useParams();
  const planId = typeof params.planId === "string" ? params.planId : "";
  const { accessToken, user } = useAuth();
  const { showError, showSuccess } = useToast();

  const [plan, setPlan] = useState<SubscriptionPlanAdminRow | null>(null);
  const [matrix, setMatrix] = useState<EntitlementsMatrixResponse | null>(null);
  const [allPlans, setAllPlans] = useState<SubscriptionPlanAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copySourceId, setCopySourceId] = useState("");
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [copyRunning, setCopyRunning] = useState(false);

  const loadData = useCallback(async () => {
    if (!accessToken || !planId) return;
    setLoading(true);
    setNotFound(false);
    try {
      const [plansData, matrixData] = await Promise.all([
        fetchAdminMonetizationPlans(accessToken),
        fetchAdminEntitlementsMatrix(accessToken),
      ]);
      setAllPlans(plansData);
      const matched = plansData.find((p) => p.id === planId);
      if (!matched) {
        setNotFound(true);
        setPlan(null);
        setMatrix(null);
        return;
      }
      setPlan(matched);
      setMatrix(ensurePlanInMatrix(matrixData, matched));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load plan capabilities");
    } finally {
      setLoading(false);
    }
  }, [accessToken, planId, showError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const { toggleEntitlement, saveEntitlementFromDraft } = useOptimisticEntitlement({
    accessToken,
    currentUserId: user?.id,
    matrix,
    setMatrix,
    showSuccess,
    showError,
  });

  const planLabel = plan?.display_name ?? plan?.plan_key ?? "Plan";
  const currentUserLabel = user?.full_name ?? user?.email ?? null;

  const capabilityRows = useMemo(
    () => (matrix && planId ? buildPlanCapabilityRows(matrix, planId) : []),
    [matrix, planId]
  );

  const copySourceOptions = useMemo(
    () => allPlans.filter((p) => p.id !== planId),
    [allPlans, planId]
  );

  const runBulkReadonly = async () => {
    if (!accessToken || !planId) return;
    setBulkRunning(true);
    try {
      const result = await bulkEnableAdminReadonlyEntitlements(accessToken, planId);
      showSuccess(
        `Enabled read-only capabilities (${result.entitlements_upserted} cells on this plan)`
      );
      await loadData();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Bulk enable failed");
    } finally {
      setBulkRunning(false);
    }
  };

  const runCopy = async () => {
    if (!accessToken || !copySourceId || !planId) return;
    setCopyRunning(true);
    try {
      const result = await copyAdminPlanEntitlements(accessToken, copySourceId, planId);
      showSuccess(`Copied ${result.entitlements_copied} entitlements`);
      setCopyDialogOpen(false);
      await loadData();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Copy failed");
    } finally {
      setCopyRunning(false);
    }
  };

  const entitlementsMatrixHref = `${ADMIN_DASHBOARD}/monetization/entitlements?planId=${encodeURIComponent(planId)}`;
  const plansHref = `${ADMIN_DASHBOARD}/monetization/plans`;

  if (!planId) {
    return (
      <EmptyState
        title="Invalid plan"
        description="No plan id was provided in the URL."
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 pb-10">
        <LoadingSkeleton className="h-10 w-64 rounded-lg" />
        <EntitlementsMatrixSkeleton planCount={1} />
      </div>
    );
  }

  if (notFound || !plan) {
    return (
      <div className="space-y-4 pb-10">
        <EmptyState
          title="Plan not found"
          description="This plan does not exist or you do not have access."
        />
        <SecondaryButton asChild>
          <Link href={plansHref}>Back to plans</Link>
        </SecondaryButton>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-col gap-3">
        <SecondaryButton asChild className="w-fit">
          <Link href={plansHref}>
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Back to plans
          </Link>
        </SecondaryButton>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Plan capabilities</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage which AI capabilities are enabled for this subscription plan.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">{planLabel}</span>
              <span className="font-mono text-xs text-muted-foreground">{plan.plan_key}</span>
              <StripeManagedBadge />
              <Badge variant={plan.is_active ? "default" : "secondary"}>
                {plan.is_active ? "Active" : "Inactive"}
              </Badge>
              <span className="text-sm text-muted-foreground">{formatPlanAmount(plan)}</span>
            </div>
            {!plan.is_active && (
              <p className="mt-2 text-sm text-amber-600 dark:text-amber-500">
                This plan is inactive. Entitlements apply when the plan is reactivated.
              </p>
            )}
          </div>
          <SecondaryButton asChild className="w-fit shrink-0">
            <Link href={entitlementsMatrixHref}>
              <LayoutGrid className="mr-2 size-4" aria-hidden />
              View in matrix
            </Link>
          </SecondaryButton>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-4">
        <p className="text-sm font-medium text-foreground">Bulk actions</p>
        <div className="flex flex-col flex-wrap gap-3 sm:flex-row sm:items-end">
          <PrimaryButton
            type="button"
            disabled={bulkRunning}
            onClick={() => void runBulkReadonly()}
          >
            {bulkRunning ? "Enabling…" : "Enable all read-only capabilities"}
          </PrimaryButton>
          <div className="hidden h-9 w-px bg-border sm:block" aria-hidden />
          <div>
            <FormLabel>Copy entitlements from</FormLabel>
            <select
              className={cn(selectClass, "mt-1")}
              value={copySourceId}
              onChange={(e) => setCopySourceId(e.target.value)}
            >
              <option value="">Select source plan…</option>
              {copySourceOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name ?? p.plan_key}
                </option>
              ))}
            </select>
          </div>
          <SecondaryButton
            type="button"
            disabled={!copySourceId}
            onClick={() => setCopyDialogOpen(true)}
          >
            Copy to this plan…
          </SecondaryButton>
        </div>
      </div>

      {!matrix || capabilityRows.length === 0 ? (
        <EmptyState
          title="No capabilities"
          description="AI capabilities are defined in the database. Run migrations to seed ai_capabilities."
        />
      ) : (
        <PlanCapabilitiesList
          planId={planId}
          planLabel={planLabel}
          rows={capabilityRows}
          currentUserId={user?.id}
          currentUserLabel={currentUserLabel}
          onToggle={(capabilityKey, isEnabled) =>
            toggleEntitlement(planId, capabilityKey, isEnabled)
          }
          onSaveCell={(capabilityKey, draft) =>
            saveEntitlementFromDraft(planId, capabilityKey, draft)
          }
        />
      )}

      <AlertDialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copy entitlements to this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces all entitlements on <strong>{planLabel}</strong> with a copy from the
              selected source plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={copyRunning}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={copyRunning} onClick={() => void runCopy()}>
              {copyRunning ? "Copying…" : "Copy now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
